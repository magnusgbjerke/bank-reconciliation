# Bank Reconciliation App

A modern, full-stack bank reconciliation application built with Node.js, Express, PostgreSQL, and React with TypeScript.

## Features

- 🏦 **Account Management** - Create and manage multiple bank accounts
- 💰 **Transaction Management** - Add, edit, and import transactions
- 🔄 **Bank Reconciliation** - Match bank and book transactions
- 📊 **Dashboard & Analytics** - Visual insights and reporting
- 🎯 **Auto-Matching** - Intelligent transaction matching algorithms
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Joi** - Data validation
- **Helmet** - Security middleware

### Frontend

- **React 18** - UI library
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **React Router** - Navigation
- **React Query** - Data fetching
- **React Hook Form** - Form handling
- **Lucide React** - Icons
- **Recharts** - Data visualization
- **Fetch API** - HTTP requests

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd bank-reconciliation
   ```

2. **Install dependencies**

   ```bash
   # Install all dependencies (recommended)
   npm run install:all

   # Or install manually:
   npm install
   cd client
   npm install --legacy-peer-deps
   cd ..
   ```

3. **Set up environment variables**

   ```bash
   # Copy the example environment file
   cp env.example .env

   # Edit the .env file with your database credentials
   nano .env
   ```

4. **Configure PostgreSQL**

   ```sql
   -- Create the database
   CREATE DATABASE bank_reconciliation;

   ```

5. **Update environment variables**

   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=bank_reconciliation
   DB_USER=postgres
   DB_PASSWORD=your_password

   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # JWT Secret
   JWT_SECRET=your_jwt_secret_key_here

   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000
   ```

## Running the Application

### Development Mode

1. **Start the backend server**

   ```bash
   npm run server:dev
   ```

2. **Start the frontend development server**

   ```bash
   cd client
   npm start
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/api/health

### Production Mode

1. **Build the frontend**

   ```bash
   cd client
   npm run build
   cd ..
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## API Endpoints

### Accounts

- `GET /api/accounts` - Get all accounts
- `GET /api/accounts/:id` - Get account details
- `POST /api/accounts` - Create new account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account
- `GET /api/accounts/:id/balance-history` - Get balance history

### Transactions

- `GET /api/transactions/account/:accountId` - Get transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `POST /api/transactions/import/:accountId` - Import transactions

### Reconciliation

- `GET /api/reconciliation/account/:accountId` - Get reconciliations
- `GET /api/reconciliation/:id` - Get reconciliation details
- `POST /api/reconciliation` - Create reconciliation
- `PUT /api/reconciliation/:id/status` - Update status
- `POST /api/reconciliation/:id/match` - Match transactions
- `POST /api/reconciliation/:id/auto-match` - Auto-match transactions

## Database Schema

The application automatically creates the following tables:

- **accounts** - Bank accounts
- **transactions** - Financial transactions
- **reconciliation_records** - Reconciliation sessions
- **reconciliation_matches** - Matched transactions

## Features in Detail

### Account Management

- Create multiple bank accounts
- Track account balances
- View transaction history
- Account type categorization

### Transaction Management

- Manual transaction entry
- Bulk import from CSV/Excel
- Transaction categorization
- Reference number tracking

### Bank Reconciliation

- Create reconciliation sessions
- Match bank and book transactions
- Automatic matching algorithms
- Manual matching interface
- Reconciliation status tracking

### Dashboard & Analytics

- Account overview
- Transaction summaries
- Reconciliation status
- Balance trends
- Visual charts and graphs

## File Import Format

The application supports importing transactions from CSV and Excel files. Expected columns:

- **Date** - Transaction date
- **Description** - Transaction description
- **Amount** - Transaction amount
- **Type** - Credit or Debit
- **Reference** - Reference number (optional)
- **Category** - Transaction category (optional)

## Security Features

- CORS protection
- Rate limiting
- Input validation
- SQL injection protection
- XSS protection with Helmet

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions, please open an issue on GitHub.
