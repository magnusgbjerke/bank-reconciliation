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

    // Insert accounts and store their IDs
    console.log("📊 Creating accounts...");
    const accountIdMap = new Map();

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
      const accountId = result.rows[0].id;
      accountIdMap.set(account.name, accountId);
      console.log(`✅ Created account: ${account.name} (ID: ${accountId})`);
    }

    // Insert bank statement transactions
    console.log("🏦 Creating bank statement transactions...");
    for (const bankStatement of mockData.bankStatements) {
      // Find the corresponding account by name
      const accountName = mockData.accounts.find(
        (acc) => acc.account_number === bankStatement.account_number
      )?.name;
      const accountId = accountIdMap.get(accountName);

      if (!accountId) {
        console.warn(
          `⚠️  Account not found for bank statement: ${bankStatement.account_id}`
        );
        continue;
      }

      for (const transaction of bankStatement.transactions) {
        await db.query(
          `INSERT INTO transactions 
           (account_id, transaction_date, description, amount, transaction_type, reference_number, category, source, is_reconciled) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            accountId,
            transaction.transaction_date,
            transaction.description,
            transaction.amount,
            transaction.transaction_type,
            transaction.reference_number,
            transaction.category,
            transaction.source,
            transaction.is_reconciled,
          ]
        );
      }
      console.log(
        `✅ Added ${bankStatement.transactions.length} bank transactions for account ${accountName}`
      );
    }

    // Insert your records (book transactions)
    console.log("📚 Creating your book transactions...");
    for (const yourRecord of mockData.yourRecords) {
      // Find the corresponding account by name
      const accountName = mockData.accounts.find(
        (acc) => acc.account_number === yourRecord.account_number
      )?.name;
      const accountId = accountIdMap.get(accountName);

      if (!accountId) {
        console.warn(
          `⚠️  Account not found for book record: ${yourRecord.account_id}`
        );
        continue;
      }

      for (const transaction of yourRecord.transactions) {
        await db.query(
          `INSERT INTO transactions 
           (account_id, transaction_date, description, amount, transaction_type, reference_number, category, source, is_reconciled) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            accountId,
            transaction.transaction_date,
            transaction.description,
            transaction.amount,
            transaction.transaction_type,
            transaction.reference_number,
            transaction.category,
            transaction.source,
            transaction.is_reconciled,
          ]
        );
      }
      console.log(
        `✅ Added ${yourRecord.transactions.length} book transactions for account ${accountName}`
      );
    }

    // Insert reconciliation records
    console.log("📋 Creating reconciliation records...");
    for (const reconciliationRecord of mockData.reconciliationRecords) {
      // Find the corresponding account by name
      const accountName = mockData.accounts.find(
        (acc) => acc.account_number === reconciliationRecord.account_number
      )?.name;
      const accountId = accountIdMap.get(accountName);

      if (!accountId) {
        console.warn(
          `⚠️  Account not found for reconciliation record: ${reconciliationRecord.account_id}`
        );
        continue;
      }

      await db.query(
        `INSERT INTO reconciliation_records 
         (account_id, reconciliation_date, starting_balance, ending_balance, status, notes) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          accountId,
          reconciliationRecord.reconciliation_date,
          reconciliationRecord.starting_balance,
          reconciliationRecord.ending_balance,
          reconciliationRecord.status,
          reconciliationRecord.notes,
        ]
      );
      console.log(
        `✅ Created reconciliation record for account ${accountName}`
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
