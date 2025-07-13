#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Setting up Bank Reconciliation App...\n");

// Check if Node.js is installed
try {
  const nodeVersion = execSync("node --version", { encoding: "utf8" });
  console.log(`✅ Node.js version: ${nodeVersion.trim()}`);
} catch (error) {
  console.error("❌ Node.js is not installed. Please install Node.js first.");
  process.exit(1);
}

// Check if npm is installed
try {
  const npmVersion = execSync("npm --version", { encoding: "utf8" });
  console.log(`✅ npm version: ${npmVersion.trim()}`);
} catch (error) {
  console.error("❌ npm is not installed. Please install npm first.");
  process.exit(1);
}

// Install backend dependencies
console.log("\n📦 Installing backend dependencies...");
try {
  execSync("npm install", { stdio: "inherit" });
  console.log("✅ Backend dependencies installed successfully");
} catch (error) {
  console.error("❌ Failed to install backend dependencies");
  process.exit(1);
}

// Install frontend dependencies
console.log("\n📦 Installing frontend dependencies...");
try {
  execSync("npm install", { cwd: "./client", stdio: "inherit" });
  console.log("✅ Frontend dependencies installed successfully");
} catch (error) {
  console.error("❌ Failed to install frontend dependencies");
  process.exit(1);
}

// Check if .env file exists
const envPath = path.join(__dirname, ".env");
if (!fs.existsSync(envPath)) {
  console.log("\n📝 Creating .env file...");
  try {
    const envExample = fs.readFileSync(
      path.join(__dirname, "env.example"),
      "utf8"
    );
    fs.writeFileSync(envPath, envExample);
    console.log("✅ .env file created from template");
    console.log(
      "⚠️  Please update the .env file with your database credentials"
    );
  } catch (error) {
    console.error("❌ Failed to create .env file");
    process.exit(1);
  }
} else {
  console.log("✅ .env file already exists");
}

console.log("\n🎉 Setup completed successfully!");
console.log("\n📋 Next steps:");
console.log("1. Update the .env file with your PostgreSQL credentials");
console.log('2. Create a PostgreSQL database named "bank_reconciliation"');
console.log("3. Start the backend server: npm run server:dev");
console.log("4. Start the frontend: cd client && npm start");
console.log("\n📖 For detailed instructions, see the README.md file");
