export interface Account {
  id: number;
  name: string;
  account_number: string | null;
  account_type: "checking" | "savings" | "credit" | "investment";
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  account_id: number;
  transaction_date: string;
  description: string;
  amount: number;
  transaction_type: "credit" | "debit";
  reference_number: string | null;
  category: string | null;
  is_reconciled: boolean;
  reconciliation_id: number | null;
  created_at: string;
  updated_at: string;
  account_name?: string;
}

export interface ReconciliationRecord {
  id: number;
  account_id: number;
  reconciliation_date: string;
  starting_balance: number;
  ending_balance: number;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  notes: string | null;
  created_at: string;
  updated_at: string;
  account_name?: string;
}

export interface ReconciliationMatch {
  id: number;
  reconciliation_id: number;
  bank_transaction_id: number;
  book_transaction_id: number;
  match_type: "automatic" | "manual";
  created_at: string;
  bank_date?: string;
  bank_description?: string;
  bank_amount?: number;
  book_date?: string;
  book_description?: string;
  book_amount?: number;
}

export interface ReconciliationDetails {
  reconciliation: ReconciliationRecord;
  unmatchedTransactions: Transaction[];
  matchedTransactions: ReconciliationMatch[];
  summary: {
    totalMatched: number;
    totalUnmatched: number;
    difference: number;
  };
}

export interface AccountSummary {
  account: Account;
  summary: {
    total_transactions: number;
    reconciled_transactions: number;
    unreconciled_transactions: number;
    total_credits: number;
    total_debits: number;
    last_transaction_date: string | null;
    total_reconciliations: number;
    completed_reconciliations: number;
    pending_reconciliations: number;
    last_reconciliation_date: string | null;
  };
  recentTransactions: Transaction[];
}

export interface BalanceHistory {
  date: string;
  daily_change: number;
  running_balance: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  pagination: PaginationInfo;
}

export interface AccountsResponse {
  accounts: Account[];
}

export interface ReconciliationsResponse {
  reconciliations: ReconciliationRecord[];
}

export interface CreateTransactionRequest {
  accountId: number;
  transactionDate: string;
  description: string;
  amount: number;
  transactionType: "credit" | "debit";
  referenceNumber?: string;
  category?: string;
}

export interface CreateAccountRequest {
  name: string;
  accountNumber?: string;
  accountType: "checking" | "savings" | "credit" | "investment";
  balance?: number;
  currency?: string;
  isActive?: boolean;
}

export interface CreateReconciliationRequest {
  accountId: number;
  reconciliationDate: string;
  startingBalance: number;
  endingBalance: number;
  notes?: string;
}

export interface MatchTransactionsRequest {
  bankTransactionId: number;
  bookTransactionId: number;
  matchType?: "automatic" | "manual";
}
