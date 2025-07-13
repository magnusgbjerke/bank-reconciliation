const express = require("express");
const Joi = require("joi");
const db = require("../config/database");

const router = express.Router();

// Validation schemas
const reconciliationSchema = Joi.object({
  accountId: Joi.number().integer().positive().required(),
  reconciliationDate: Joi.date().required(),
  startingBalance: Joi.number().precision(2).required(),
  endingBalance: Joi.number().precision(2).required(),
  notes: Joi.string().max(1000).optional(),
});

const matchSchema = Joi.object({
  bankTransactionId: Joi.number().integer().positive().required(),
  bookTransactionId: Joi.number().integer().positive().required(),
  matchType: Joi.string().valid("automatic", "manual").default("manual"),
});

// Create new reconciliation record
const handleCreateReconciliation = async (req, res) => {
  try {
    const { error, value } = reconciliationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const {
      accountId,
      reconciliationDate,
      startingBalance,
      endingBalance,
      notes,
    } = value;

    // Verify account exists
    const accountResult = await db.query(
      "SELECT id FROM accounts WHERE id = $1",
      [accountId]
    );
    if (accountResult.rows.length === 0) {
      return res.status(404).json({ error: "Account not found" });
    }

    // Check if reconciliation already exists for this date and account
    const existingResult = await db.query(
      "SELECT id FROM reconciliation_records WHERE account_id = $1 AND reconciliation_date = $2",
      [accountId, reconciliationDate]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({
        error: "Reconciliation record already exists for this date and account",
      });
    }

    const result = await db.query(
      `INSERT INTO reconciliation_records 
       (account_id, reconciliation_date, starting_balance, ending_balance, notes) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [accountId, reconciliationDate, startingBalance, endingBalance, notes]
    );

    res.status(201).json({
      message: "Reconciliation record created successfully",
      reconciliation: result.rows[0],
    });
  } catch (error) {
    console.error("Create reconciliation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get reconciliation records for an account
const handleGetReconciliations = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { status, startDate, endDate } = req.query;

    let query = `
      SELECT r.*, a.name as account_name 
      FROM reconciliation_records r 
      JOIN accounts a ON r.account_id = a.id 
      WHERE r.account_id = $1
    `;
    const queryParams = [accountId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND r.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (startDate) {
      paramCount++;
      query += ` AND r.reconciliation_date >= $${paramCount}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND r.reconciliation_date <= $${paramCount}`;
      queryParams.push(endDate);
    }

    query += ` ORDER BY r.reconciliation_date DESC`;

    const result = await db.query(query, queryParams);

    res.json({
      reconciliations: result.rows,
    });
  } catch (error) {
    console.error("Get reconciliations error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get reconciliation details with unmatched transactions
const handleGetReconciliationDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Get reconciliation record
    const reconciliationResult = await db.query(
      `SELECT r.*, a.name as account_name 
       FROM reconciliation_records r 
       JOIN accounts a ON r.account_id = a.id 
       WHERE r.id = $1`,
      [id]
    );

    if (reconciliationResult.rows.length === 0) {
      return res.status(404).json({ error: "Reconciliation record not found" });
    }

    const reconciliation = reconciliationResult.rows[0];

    // Get unmatched bank transactions
    const unmatchedBankResult = await db.query(
      `SELECT t.* 
       FROM transactions t 
       WHERE t.account_id = $1 
       AND t.is_reconciled = false 
       AND t.transaction_date = $2
       ORDER BY t.transaction_date DESC`,
      [reconciliation.account_id, reconciliation.reconciliation_date]
    );

    // Get matched transactions
    const matchedResult = await db.query(
      `SELECT rm.*, 
              bt.transaction_date as bank_date, bt.description as bank_description, bt.amount as bank_amount,
              bkt.transaction_date as book_date, bkt.description as book_description, bkt.amount as book_amount
       FROM reconciliation_matches rm
       JOIN transactions bt ON rm.bank_transaction_id = bt.id
       JOIN transactions bkt ON rm.book_transaction_id = bkt.id
       WHERE rm.reconciliation_id = $1
       ORDER BY rm.created_at DESC`,
      [id]
    );

    // Calculate totals
    const totalMatched = matchedResult.rows.reduce(
      (sum, match) => sum + parseFloat(match.bank_amount),
      0
    );
    const totalUnmatched = unmatchedBankResult.rows.reduce(
      (sum, transaction) => sum + parseFloat(transaction.amount),
      0
    );

    res.json({
      reconciliation,
      unmatchedTransactions: unmatchedBankResult.rows,
      matchedTransactions: matchedResult.rows,
      summary: {
        totalMatched,
        totalUnmatched,
        difference:
          reconciliation.ending_balance -
          reconciliation.starting_balance -
          totalMatched,
      },
    });
  } catch (error) {
    console.error("Get reconciliation details error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Match transactions
const handleMatchTransactions = async (req, res) => {
  try {
    const { reconciliationId } = req.params;
    const { error, value } = matchSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { bankTransactionId, bookTransactionId, matchType } = value;

    // Verify reconciliation exists
    const reconciliationResult = await db.query(
      "SELECT id FROM reconciliation_records WHERE id = $1",
      [reconciliationId]
    );

    if (reconciliationResult.rows.length === 0) {
      return res.status(404).json({ error: "Reconciliation record not found" });
    }

    // Verify transactions exist and are not already reconciled
    const bankTransactionResult = await db.query(
      "SELECT id, is_reconciled FROM transactions WHERE id = $1",
      [bankTransactionId]
    );

    const bookTransactionResult = await db.query(
      "SELECT id, is_reconciled FROM transactions WHERE id = $1",
      [bookTransactionId]
    );

    if (
      bankTransactionResult.rows.length === 0 ||
      bookTransactionResult.rows.length === 0
    ) {
      return res
        .status(404)
        .json({ error: "One or both transactions not found" });
    }

    if (
      bankTransactionResult.rows[0].is_reconciled ||
      bookTransactionResult.rows[0].is_reconciled
    ) {
      return res
        .status(400)
        .json({ error: "One or both transactions are already reconciled" });
    }

    // Create match record
    await db.query(
      `INSERT INTO reconciliation_matches 
       (reconciliation_id, bank_transaction_id, book_transaction_id, match_type) 
       VALUES ($1, $2, $3, $4)`,
      [reconciliationId, bankTransactionId, bookTransactionId, matchType]
    );

    // Mark transactions as reconciled
    await db.query(
      "UPDATE transactions SET is_reconciled = true WHERE id IN ($1, $2)",
      [bankTransactionId, bookTransactionId]
    );

    res.json({
      message: "Transactions matched successfully",
    });
  } catch (error) {
    console.error("Match transactions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update reconciliation status
const handleUpdateReconciliationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (
      !["pending", "in_progress", "completed", "cancelled"].includes(status)
    ) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const result = await db.query(
      "UPDATE reconciliation_records SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Reconciliation record not found" });
    }

    res.json({
      message: "Reconciliation status updated successfully",
      reconciliation: result.rows[0],
    });
  } catch (error) {
    console.error("Update reconciliation status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Auto-match transactions based on amount and date
const handleAutoMatch = async (req, res) => {
  try {
    const { reconciliationId } = req.params;

    // Get reconciliation details
    const reconciliationResult = await db.query(
      "SELECT * FROM reconciliation_records WHERE id = $1",
      [reconciliationId]
    );

    if (reconciliationResult.rows.length === 0) {
      return res.status(404).json({ error: "Reconciliation record not found" });
    }

    const reconciliation = reconciliationResult.rows[0];

    // Get unmatched transactions for the reconciliation date
    const unmatchedResult = await db.query(
      `SELECT * FROM transactions 
       WHERE account_id = $1 
       AND transaction_date = $2 
       AND is_reconciled = false
       ORDER BY amount DESC`,
      [reconciliation.account_id, reconciliation.reconciliation_date]
    );

    const unmatchedTransactions = unmatchedResult.rows;
    const matches = [];
    const processedIds = new Set();

    // Simple matching algorithm: match by exact amount
    for (let i = 0; i < unmatchedTransactions.length; i++) {
      if (processedIds.has(unmatchedTransactions[i].id)) continue;

      for (let j = i + 1; j < unmatchedTransactions.length; j++) {
        if (processedIds.has(unmatchedTransactions[j].id)) continue;

        // Match if amounts are equal and opposite (one credit, one debit)
        if (
          Math.abs(unmatchedTransactions[i].amount) ===
            Math.abs(unmatchedTransactions[j].amount) &&
          unmatchedTransactions[i].transaction_type !==
            unmatchedTransactions[j].transaction_type
        ) {
          // Create match
          await db.query(
            `INSERT INTO reconciliation_matches 
             (reconciliation_id, bank_transaction_id, book_transaction_id, match_type) 
             VALUES ($1, $2, $3, 'automatic')`,
            [
              reconciliationId,
              unmatchedTransactions[i].id,
              unmatchedTransactions[j].id,
            ]
          );

          // Mark as reconciled
          await db.query(
            "UPDATE transactions SET is_reconciled = true WHERE id IN ($1, $2)",
            [unmatchedTransactions[i].id, unmatchedTransactions[j].id]
          );

          matches.push({
            bankTransaction: unmatchedTransactions[i],
            bookTransaction: unmatchedTransactions[j],
          });

          processedIds.add(unmatchedTransactions[i].id);
          processedIds.add(unmatchedTransactions[j].id);
          break;
        }
      }
    }

    res.json({
      message: `Auto-matched ${matches.length} transaction pairs`,
      matches,
    });
  } catch (error) {
    console.error("Auto-match error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Routes
router.post("/", handleCreateReconciliation);
router.get("/account/:accountId", handleGetReconciliations);
router.get("/:id", handleGetReconciliationDetails);
router.post("/:reconciliationId/match", handleMatchTransactions);
router.put("/:id/status", handleUpdateReconciliationStatus);
router.post("/:reconciliationId/auto-match", handleAutoMatch);

module.exports = router;
