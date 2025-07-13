#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔧 Fixing dependency issues...\n");

// Check if node_modules exists in client directory
const clientNodeModulesPath = path.join(__dirname, "client", "node_modules");
const hasClientNodeModules = fs.existsSync(clientNodeModulesPath);

if (hasClientNodeModules) {
  console.log("🗑️  Removing existing node_modules in client directory...");
  try {
    execSync("rm -rf node_modules", { cwd: "./client", stdio: "inherit" });
    console.log("✅ Removed client node_modules");
  } catch (error) {
    console.log(
      "⚠️  Could not remove node_modules (this is normal on Windows)"
    );
  }
}

console.log("\n📦 Installing client dependencies with legacy peer deps...");
try {
  execSync("npm install --legacy-peer-deps", {
    cwd: "./client",
    stdio: "inherit",
  });
  console.log("✅ Client dependencies installed successfully");
} catch (error) {
  console.log(
    "❌ Failed to install with legacy peer deps, trying with force..."
  );
  try {
    execSync("npm install --force", { cwd: "./client", stdio: "inherit" });
    console.log("✅ Client dependencies installed with force flag");
  } catch (error2) {
    console.error("❌ Failed to install client dependencies");
    console.log("\n💡 Try running these commands manually:");
    console.log("cd client");
    console.log("npm install --legacy-peer-deps");
    process.exit(1);
  }
}

console.log("\n🎉 Dependencies fixed successfully!");
console.log("\n📋 You can now start the application:");
console.log("1. Backend: npm run server:dev");
console.log("2. Frontend: cd client && npm start");
console.log("3. Both: npm run dev");
