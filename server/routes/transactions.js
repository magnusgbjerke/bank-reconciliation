const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const XLSX = require("xlsx");
const Joi = require("joi");
const db = require("../config/database");

const router = express.Router();

// Validation schemas
const transactionSchema = Joi.object({
  accountId: Joi.number().integer().positive().required(),
  transactionDate: Joi.date().required(),
  description: Joi.string().max(500).required(),
  amount: Joi.number().precision(2).positive().required(),
  transactionType: Joi.string().valid("credit", "debit").required(),
  referenceNumber: Joi.string().max(100).optional(),
  category: Joi.string().max(100).optional(),
});

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "text/csv" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV and Excel files are allowed"));
    }
  },
});

// Get all transactions for an account
const handleGetTransactions = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT t.*, a.name as account_name 
      FROM transactions t 
      JOIN accounts a ON t.account_id = a.id 
      WHERE t.account_id = $1
    `;
    const queryParams = [accountId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND t.is_reconciled = $${paramCount}`;
      queryParams.push(status === "reconciled");
    }

    if (startDate) {
      paramCount++;
      query += ` AND t.transaction_date >= $${paramCount}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND t.transaction_date <= $${paramCount}`;
      queryParams.push(endDate);
    }

    query += ` ORDER BY t.transaction_date DESC, t.created_at DESC LIMIT $${
      paramCount + 1
    } OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const result = await db.query(query, queryParams);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) FROM transactions WHERE account_id = $1`;
    const countParams = [accountId];

    if (status) {
      countQuery += ` AND is_reconciled = $2`;
      countParams.push(status === "reconciled");
    }

    const countResult = await db.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      transactions: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create new transaction
const handleCreateTransaction = async (req, res) => {
  try {
    const { error, value } = transactionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const {
      accountId,
      transactionDate,
      description,
      amount,
      transactionType,
      referenceNumber,
      category,
    } = value;

    // Verify account exists
    const accountResult = await db.query(
      "SELECT id FROM accounts WHERE id = $1",
      [accountId]
    );
    if (accountResult.rows.length === 0) {
      return res.status(404).json({ error: "Account not found" });
    }

    const result = await db.query(
      `INSERT INTO transactions 
       (account_id, transaction_date, description, amount, transaction_type, reference_number, category) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        accountId,
        transactionDate,
        description,
        amount,
        transactionType,
        referenceNumber,
        category,
      ]
    );

    res.status(201).json({
      message: "Transaction created successfully",
      transaction: result.rows[0],
    });
  } catch (error) {
    console.error("Create transaction error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update transaction
const handleUpdateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = transactionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const {
      accountId,
      transactionDate,
      description,
      amount,
      transactionType,
      referenceNumber,
      category,
    } = value;

    const result = await db.query(
      `UPDATE transactions 
       SET account_id = $1, transaction_date = $2, description = $3, amount = $4, 
           transaction_type = $5, reference_number = $6, category = $7, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $8 RETURNING *`,
      [
        accountId,
        transactionDate,
        description,
        amount,
        transactionType,
        referenceNumber,
        category,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json({
      message: "Transaction updated successfully",
      transaction: result.rows[0],
    });
  } catch (error) {
    console.error("Update transaction error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete transaction
const handleDeleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      "DELETE FROM transactions WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Delete transaction error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Import transactions from CSV/Excel
const handleImportTransactions = async (req, res) => {
  try {
    const { accountId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Verify account exists
    const accountResult = await db.query(
      "SELECT id FROM accounts WHERE id = $1",
      [accountId]
    );
    if (accountResult.rows.length === 0) {
      return res.status(404).json({ error: "Account not found" });
    }

    let transactions = [];

    if (file.mimetype === "text/csv") {
      // Parse CSV
      const csvData = file.buffer.toString();
      const lines = csvData.split("\n");
      const headers = lines[0].split(",").map((h) => h.trim());

      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(",").map((v) => v.trim());
          const transaction = {};
          headers.forEach((header, index) => {
            transaction[header.toLowerCase()] = values[index];
          });
          transactions.push(transaction);
        }
      }
    } else {
      // Parse Excel
      const workbook = XLSX.read(file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      transactions = XLSX.utils.sheet_to_json(worksheet);
    }

    // Process and insert transactions
    const insertedTransactions = [];
    const errors = [];

    for (const transaction of transactions) {
      try {
        // Map common column names
        const mappedTransaction = {
          transactionDate:
            transaction.date ||
            transaction.transaction_date ||
            transaction["transaction date"],
          description:
            transaction.description ||
            transaction.desc ||
            transaction.narration,
          amount: parseFloat(
            transaction.amount || transaction.credit || transaction.debit || 0
          ),
          transactionType:
            transaction.type ||
            transaction.transaction_type ||
            (parseFloat(transaction.credit || 0) > 0 ? "credit" : "debit"),
          referenceNumber:
            transaction.reference ||
            transaction.ref ||
            transaction.reference_number,
          category: transaction.category || transaction.cat || "",
        };

        // Validate required fields
        if (
          !mappedTransaction.transactionDate ||
          !mappedTransaction.description ||
          !mappedTransaction.amount
        ) {
          errors.push(
            `Row ${
              transactions.indexOf(transaction) + 1
            }: Missing required fields`
          );
          continue;
        }

        const result = await db.query(
          `INSERT INTO transactions 
           (account_id, transaction_date, description, amount, transaction_type, reference_number, category) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           RETURNING *`,
          [
            accountId,
            mappedTransaction.transactionDate,
            mappedTransaction.description,
            mappedTransaction.amount,
            mappedTransaction.transactionType,
            mappedTransaction.referenceNumber,
            mappedTransaction.category,
          ]
        );

        insertedTransactions.push(result.rows[0]);
      } catch (error) {
        errors.push(
          `Row ${transactions.indexOf(transaction) + 1}: ${error.message}`
        );
      }
    }

    res.json({
      message: `Import completed. ${insertedTransactions.length} transactions imported successfully.`,
      imported: insertedTransactions.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Import transactions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Routes
router.get("/account/:accountId", handleGetTransactions);
router.post("/", handleCreateTransaction);
router.put("/:id", handleUpdateTransaction);
router.delete("/:id", handleDeleteTransaction);
router.post(
  "/import/:accountId",
  upload.single("file"),
  handleImportTransactions
);

module.exports = router;
