const db = require("../config/database");
const mockData = require("../data/mockData");

const populateMockData = async () => {
  try {
    console.log("🚀 Starting to populate database with mock data...");

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log("🗑️  Clearing existing data...");
    await db.query("DELETE FROM reconciliation_matches");
    await db.query("DELETE FROM reconciliation_records");
    await db.query("DELETE FROM transactions");
    await db.query("DELETE FROM accounts");

    // Insert accounts
    console.log("📊 Creating accounts...");
    for (const account of mockData.accounts) {
      const result = await db.query(
        `INSERT INTO accounts (name, account_number, account_type, balance, currency, is_active) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [
          account.name,
          account.account_number,
          account.account_type,
          account.balance,
          account.currency,
          account.is_active,
        ]
      );
      console.log(
        `✅ Created account: ${account.name} (ID: ${result.rows[0].id})`
      );
    }

    // Insert bank statement transactions
    console.log("🏦 Creating bank statement transactions...");
    for (const bankStatement of mockData.bankStatements) {
      for (const transaction of bankStatement.transactions) {
        await db.query(
          `INSERT INTO transactions 
           (account_id, transaction_date, description, amount, transaction_type, reference_number, category, is_reconciled) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            bankStatement.account_id,
            transaction.transaction_date,
            transaction.description,
            transaction.amount,
            transaction.transaction_type,
            transaction.reference_number,
            transaction.category,
            transaction.is_reconciled,
          ]
        );
      }
      console.log(
        `✅ Added ${bankStatement.transactions.length} bank transactions for account ${bankStatement.account_id}`
      );
    }

    // Insert your records (book transactions)
    console.log("📚 Creating your book transactions...");
    for (const yourRecord of mockData.yourRecords) {
      for (const transaction of yourRecord.transactions) {
        await db.query(
          `INSERT INTO transactions 
           (account_id, transaction_date, description, amount, transaction_type, reference_number, category, is_reconciled) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            yourRecord.account_id,
            transaction.transaction_date,
            transaction.description,
            transaction.amount,
            transaction.transaction_type,
            transaction.reference_number,
            transaction.category,
            transaction.is_reconciled,
          ]
        );
      }
      console.log(
        `✅ Added ${yourRecord.transactions.length} book transactions for account ${yourRecord.account_id}`
      );
    }

    // Insert reconciliation records
    console.log("📋 Creating reconciliation records...");
    for (const reconciliationRecord of mockData.reconciliationRecords) {
      await db.query(
        `INSERT INTO reconciliation_records 
         (account_id, reconciliation_date, starting_balance, ending_balance, status, notes) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          reconciliationRecord.account_id,
          reconciliationRecord.reconciliation_date,
          reconciliationRecord.starting_balance,
          reconciliationRecord.ending_balance,
          reconciliationRecord.status,
          reconciliationRecord.notes,
        ]
      );
      console.log(
        `✅ Created reconciliation record for account ${reconciliationRecord.account_id}`
      );
    }

    console.log("🎉 Mock data population completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`- ${mockData.accounts.length} accounts created`);

    const totalBankTransactions = mockData.bankStatements.reduce(
      (sum, stmt) => sum + stmt.transactions.length,
      0
    );
    const totalBookTransactions = mockData.yourRecords.reduce(
      (sum, record) => sum + record.transactions.length,
      0
    );

    console.log(
      `- ${totalBankTransactions} bank statement transactions created`
    );
    console.log(`- ${totalBookTransactions} book transactions created`);
    console.log(
      `- ${mockData.reconciliationRecords.length} reconciliation records created`
    );

    console.log("\n💡 You can now test the bank reconciliation functionality!");
    console.log("🔗 Access the application at: http://localhost:3000");
  } catch (error) {
    console.error("❌ Error populating mock data:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

// Run the script if called directly
if (require.main === module) {
  populateMockData();
}

module.exports = populateMockData;
