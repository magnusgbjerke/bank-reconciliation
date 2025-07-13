const express = require("express");
const Joi = require("joi");
const db = require("../config/database");

const router = express.Router();

// Validation schemas
const accountSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  accountNumber: Joi.string().max(100).optional(),
  accountType: Joi.string()
    .valid("checking", "savings", "credit", "investment")
    .default("checking"),
  balance: Joi.number().precision(2).default(0.0),
  currency: Joi.string().length(3).default("USD"),
  isActive: Joi.boolean().default(true),
});

// Get all accounts
const handleGetAccounts = async (req, res) => {
  try {
    const { isActive } = req.query;

    let query = "SELECT * FROM accounts";
    const queryParams = [];

    if (isActive !== undefined) {
      query += " WHERE is_active = $1";
      queryParams.push(isActive === "true");
    }

    query += " ORDER BY name ASC";

    const result = await db.query(query, queryParams);

    res.json({
      accounts: result.rows,
    });
  } catch (error) {
    console.error("Get accounts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get account by ID with summary
const handleGetAccount = async (req, res) => {
  try {
    const { id } = req.params;

    // Get account details
    const accountResult = await db.query(
      "SELECT * FROM accounts WHERE id = $1",
      [id]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({ error: "Account not found" });
    }

    const account = accountResult.rows[0];

    // Get transaction summary
    const summaryResult = await db.query(
      `SELECT 
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN is_reconciled = true THEN 1 END) as reconciled_transactions,
        COUNT(CASE WHEN is_reconciled = false THEN 1 END) as unreconciled_transactions,
        SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE 0 END) as total_credits,
        SUM(CASE WHEN transaction_type = 'debit' THEN amount ELSE 0 END) as total_debits,
        MAX(transaction_date) as last_transaction_date
       FROM transactions 
       WHERE account_id = $1`,
      [id]
    );

    // Get recent transactions
    const recentTransactionsResult = await db.query(
      `SELECT * FROM transactions 
       WHERE account_id = $1 
       ORDER BY transaction_date DESC, created_at DESC 
       LIMIT 5`,
      [id]
    );

    // Get reconciliation summary
    const reconciliationResult = await db.query(
      `SELECT 
        COUNT(*) as total_reconciliations,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_reconciliations,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reconciliations,
        MAX(reconciliation_date) as last_reconciliation_date
       FROM reconciliation_records 
       WHERE account_id = $1`,
      [id]
    );

    res.json({
      account,
      summary: {
        ...summaryResult.rows[0],
        ...reconciliationResult.rows[0],
      },
      recentTransactions: recentTransactionsResult.rows,
    });
  } catch (error) {
    console.error("Get account error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create new account
const handleCreateAccount = async (req, res) => {
  try {
    const { error, value } = accountSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, accountNumber, accountType, balance, currency, isActive } =
      value;

    // Check if account number already exists
    if (accountNumber) {
      const existingResult = await db.query(
        "SELECT id FROM accounts WHERE account_number = $1",
        [accountNumber]
      );

      if (existingResult.rows.length > 0) {
        return res.status(400).json({ error: "Account number already exists" });
      }
    }

    const result = await db.query(
      `INSERT INTO accounts 
       (name, account_number, account_type, balance, currency, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [name, accountNumber, accountType, balance, currency, isActive]
    );

    res.status(201).json({
      message: "Account created successfully",
      account: result.rows[0],
    });
  } catch (error) {
    console.error("Create account error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update account
const handleUpdateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = accountSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, accountNumber, accountType, balance, currency, isActive } =
      value;

    // Check if account number already exists (excluding current account)
    if (accountNumber) {
      const existingResult = await db.query(
        "SELECT id FROM accounts WHERE account_number = $1 AND id != $2",
        [accountNumber, id]
      );

      if (existingResult.rows.length > 0) {
        return res.status(400).json({ error: "Account number already exists" });
      }
    }

    const result = await db.query(
      `UPDATE accounts 
       SET name = $1, account_number = $2, account_type = $3, balance = $4, 
           currency = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $7 RETURNING *`,
      [name, accountNumber, accountType, balance, currency, isActive, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Account not found" });
    }

    res.json({
      message: "Account updated successfully",
      account: result.rows[0],
    });
  } catch (error) {
    console.error("Update account error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete account
const handleDeleteAccount = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if account has transactions
    const transactionsResult = await db.query(
      "SELECT COUNT(*) FROM transactions WHERE account_id = $1",
      [id]
    );

    if (parseInt(transactionsResult.rows[0].count) > 0) {
      return res.status(400).json({
        error:
          "Cannot delete account with existing transactions. Please delete all transactions first.",
      });
    }

    // Check if account has reconciliation records
    const reconciliationResult = await db.query(
      "SELECT COUNT(*) FROM reconciliation_records WHERE account_id = $1",
      [id]
    );

    if (parseInt(reconciliationResult.rows[0].count) > 0) {
      return res.status(400).json({
        error:
          "Cannot delete account with existing reconciliation records. Please delete all reconciliation records first.",
      });
    }

    const result = await db.query(
      "DELETE FROM accounts WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Account not found" });
    }

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get account balance history
const handleGetAccountBalanceHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    let query = `
      SELECT 
        DATE(transaction_date) as date,
        SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE -amount END) as daily_change,
        SUM(SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE -amount END)) 
          OVER (ORDER BY DATE(transaction_date)) as running_balance
      FROM transactions 
      WHERE account_id = $1
    `;
    const queryParams = [id];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      query += ` AND transaction_date >= $${paramCount}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND transaction_date <= $${paramCount}`;
      queryParams.push(endDate);
    }

    query += ` GROUP BY DATE(transaction_date) ORDER BY date ASC`;

    const result = await db.query(query, queryParams);

    res.json({
      balanceHistory: result.rows,
    });
  } catch (error) {
    console.error("Get account balance history error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Routes
router.get("/", handleGetAccounts);
router.get("/:id", handleGetAccount);
router.post("/", handleCreateAccount);
router.put("/:id", handleUpdateAccount);
router.delete("/:id", handleDeleteAccount);
router.get("/:id/balance-history", handleGetAccountBalanceHistory);

module.exports = router;
