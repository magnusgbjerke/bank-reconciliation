# Mock Data for Bank Reconciliation

This directory contains comprehensive mock data for testing the bank reconciliation application.

## 📁 Files

- `mockData.js` - Contains all mock data including accounts, bank statements, and your records
- `README.md` - This documentation file

## 🏦 Mock Data Structure

### Accounts

- **Main Business Checking** (ID: 1) - Balance: $15,420.75
- **Business Savings Account** (ID: 2) - Balance: $25,000.00
- **Credit Card Account** (ID: 3) - Balance: -$1,250.50

### Bank Statements

Each account has corresponding bank statement transactions with:

- Realistic transaction descriptions
- Proper categorization
- Reference numbers
- Dates spanning January 2024

### Your Records (Book Transactions)

Each account also has your internal book transactions that should match the bank statements for reconciliation testing.

## 🚀 How to Use

### 1. Populate Database with Mock Data

```bash
npm run populate-mock
```

This will:

- Clear existing data (optional)
- Create 3 sample accounts
- Add 22 bank statement transactions
- Add 22 book transactions
- Create 3 reconciliation records

### 2. Test Reconciliation Scenarios

The mock data includes various scenarios perfect for testing:

#### ✅ Matching Transactions

- Customer payments with same amounts and dates
- ATM withdrawals
- Office supplies purchases
- Transfer transactions
- Fuel expenses

#### 🔍 Reconciliation Challenges

- Different descriptions for same transactions
- Different reference numbers
- Various transaction categories
- Mixed credit and debit transactions

### 3. Sample Reconciliation Workflow

1. **Start Reconciliation**: Navigate to the reconciliation section
2. **Select Account**: Choose "Main Business Checking"
3. **Review Transactions**: Compare bank statements vs your records
4. **Match Transactions**: Use the matching interface
5. **Resolve Differences**: Handle any discrepancies
6. **Complete Reconciliation**: Finalize the process

## 📊 Data Summary

| Account                | Bank Transactions | Book Transactions | Balance    |
| ---------------------- | ----------------- | ----------------- | ---------- |
| Main Business Checking | 10                | 10                | $15,420.75 |
| Business Savings       | 2                 | 2                 | $25,000.00 |
| Credit Card            | 10                | 10                | -$1,250.50 |

## 🎯 Testing Scenarios

### Perfect Match Scenarios

- Customer payments (ABC Corp, XYZ Company)
- ATM withdrawals
- Office supplies purchases
- Transfer transactions

### Near Match Scenarios

- Different descriptions for same transaction
- Different reference number formats
- Slight amount variations

### Unmatched Scenarios

- Bank-only transactions (fees, interest)
- Book-only transactions (pending items)

## 🔧 Customization

To modify the mock data:

1. Edit `mockData.js`
2. Add new accounts, transactions, or reconciliation records
3. Run `npm run populate-mock` again

## 📝 Notes

- All transactions are from January 2024
- Reference numbers follow consistent patterns
- Categories are business-appropriate
- Amounts are realistic for a small business
- All transactions start as unreconciled

## 🚨 Important

The populate script will **clear existing data** before inserting mock data. If you want to keep existing data, comment out the DELETE statements in `populateMockData.js`.
