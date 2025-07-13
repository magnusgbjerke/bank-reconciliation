#!/usr/bin/env node

const { Client } = require("pg");
require("dotenv").config();

const setupDatabase = async () => {
  console.log("🗄️  Setting up PostgreSQL database...\n");

  // Create a client to connect to PostgreSQL
  const client = new Client({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "your_password",
    database: "postgres", // Connect to default database first
  });

  try {
    // Connect to PostgreSQL
    await client.connect();
    console.log("✅ Connected to PostgreSQL");

    // Check if database exists
    const dbExists = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'bank_reconciliation'"
    );

    if (dbExists.rows.length === 0) {
      // Create database
      await client.query("CREATE DATABASE bank_reconciliation");
      console.log('✅ Database "bank_reconciliation" created successfully');
    } else {
      console.log('✅ Database "bank_reconciliation" already exists');
    }

    // Close connection to postgres database
    await client.end();

    // Connect to the new database
    const dbClient = new Client({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "your_password",
      database: "bank_reconciliation",
    });

    await dbClient.connect();
    console.log("✅ Connected to bank_reconciliation database");

    // Create tables
    console.log("\n📋 Creating database tables...");

    // Accounts table
    await dbClient.query(`
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
    console.log("✅ Accounts table created");

    // Transactions table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
        transaction_date DATE NOT NULL,
        description TEXT,
        amount DECIMAL(15,2) NOT NULL,
        transaction_type VARCHAR(20) CHECK (transaction_type IN ('credit', 'debit')),
        reference_number VARCHAR(100),
        category VARCHAR(100),
        is_reconciled BOOLEAN DEFAULT false,
        reconciliation_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Transactions table created");

    // Reconciliation records table
    await dbClient.query(`
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
    console.log("✅ Reconciliation records table created");

    // Reconciliation matches table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS reconciliation_matches (
        id SERIAL PRIMARY KEY,
        reconciliation_id INTEGER REFERENCES reconciliation_records(id) ON DELETE CASCADE,
        bank_transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
        book_transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
        match_type VARCHAR(20) DEFAULT 'manual' CHECK (match_type IN ('automatic', 'manual')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Reconciliation matches table created");

    await dbClient.end();
    console.log("\n🎉 Database setup completed successfully!");
    console.log("\n📋 You can now start the application:");
    console.log("1. Backend: npm run server:dev");
    console.log("2. Frontend: cd client && npm start");
  } catch (error) {
    console.error("❌ Database setup failed:", error.message);
    console.log("\n💡 Make sure:");
    console.log("1. PostgreSQL is running");
    console.log("2. Database credentials in .env file are correct");
    console.log("3. User has permission to create databases");
    process.exit(1);
  }
};

// Run the setup
setupDatabase();
