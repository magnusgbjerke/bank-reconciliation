const db = require("../config/database");

const addSourceColumn = async () => {
  try {
    console.log("🔧 Adding source column to transactions table...");

    // Check if the source column already exists
    const checkColumn = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' AND column_name = 'source'
    `);

    if (checkColumn.rows.length === 0) {
      // Add the source column
      await db.query(`
        ALTER TABLE transactions 
        ADD COLUMN source VARCHAR(20) DEFAULT 'book' CHECK (source IN ('bank', 'book'))
      `);
      console.log("✅ Source column added successfully!");
    } else {
      console.log("ℹ️  Source column already exists");
    }

    // Update existing transactions to have a default source
    console.log("🔄 Updating existing transactions with default source...");
    await db.query(`
      UPDATE transactions 
      SET source = 'book' 
      WHERE source IS NULL
    `);
    console.log("✅ Existing transactions updated!");

    console.log("🎉 Database migration completed successfully!");
  } catch (error) {
    console.error("❌ Error adding source column:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

// Run the migration if called directly
if (require.main === module) {
  addSourceColumn();
}

module.exports = addSourceColumn;
