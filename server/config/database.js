const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "bank-reconciliation",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgrespassword",
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ Unexpected error on idle client", err);
  process.exit(-1);
});

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Create accounts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        account_number VARCHAR(100) UNIQUE,
        account_type VARCHAR(50) DEFAULT 'checking',
        balance DECIMAL(15,2) DEFAULT 0.00,
        currency VARCHAR(3) DEFAULT 'USD',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
        transaction_date DATE NOT NULL,
        description TEXT,
        amount DECIMAL(15,2) NOT NULL,
        transaction_type VARCHAR(20) CHECK (transaction_type IN ('credit', 'debit')),
        reference_number VARCHAR(100),
        category VARCHAR(100),
        source VARCHAR(20) DEFAULT 'book' CHECK (source IN ('bank', 'book')),
        is_reconciled BOOLEAN DEFAULT false,
        reconciliation_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create reconciliation_records table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reconciliation_records (
        id SERIAL PRIMARY KEY,
        account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
        reconciliation_date DATE NOT NULL,
        starting_balance DECIMAL(15,2) NOT NULL,
        ending_balance DECIMAL(15,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create reconciliation_matches table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reconciliation_matches (
        id SERIAL PRIMARY KEY,
        reconciliation_id INTEGER REFERENCES reconciliation_records(id) ON DELETE CASCADE,
        bank_transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
        book_transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
        match_type VARCHAR(20) DEFAULT 'manual' CHECK (match_type IN ('automatic', 'manual')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ Database tables initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  }
};

// Initialize database on startup
initializeDatabase();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
