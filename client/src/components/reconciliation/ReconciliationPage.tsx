import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

interface Transaction {
  id: number;
  account_id: number;
  transaction_date: string;
  description: string;
  amount: number;
  transaction_type: "credit" | "debit";
  reference_number: string;
  category: string;
  is_reconciled: boolean;
  source: "bank" | "book"; // Added source field
}

interface Account {
  id: number;
  name: string;
  account_number: string;
  account_type: string;
  balance: number;
  currency: string;
  is_active: boolean;
}

const ReconciliationPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [bankTransactions, setBankTransactions] = useState<Transaction[]>([]);
  const [bookTransactions, setBookTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [matchedTransactions, setMatchedTransactions] = useState<Set<number>>(
    new Set()
  );

  // Fetch accounts on component mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Fetch transactions when account is selected
  useEffect(() => {
    if (selectedAccount) {
      fetchTransactions(selectedAccount);
    }
  }, [selectedAccount]);

  const fetchAccounts = async () => {
    try {
      console.log("🔍 Fetching accounts from API...");
      const response = await fetch("http://localhost:5000/api/accounts");
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Accounts fetched:", data.accounts);
        setAccounts(data.accounts);
        if (data.accounts.length > 0) {
          setSelectedAccount(data.accounts[0].id);
        }
      } else {
        console.error("❌ Failed to fetch accounts:", response.status);
      }
    } catch (error) {
      console.error("❌ Error fetching accounts:", error);
      toast.error("Failed to load accounts");
    }
  };

  const fetchTransactions = async (accountId: number) => {
    setLoading(true);
    try {
      console.log(`🔍 Fetching transactions for account ${accountId}...`);
      const response = await fetch(
        `http://localhost:5000/api/transactions/account/${accountId}`
      );
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Transactions fetched:", data.transactions);
        const allTransactions = data.transactions;

        // Separate bank statements and book transactions based on source field
        const bankStmts = allTransactions.filter(
          (t: Transaction) => t.source === "bank"
        );

        const bookRecords = allTransactions.filter(
          (t: Transaction) => t.source === "book"
        );

        console.log(
          `📊 Bank transactions: ${bankStmts.length}, Book transactions: ${bookRecords.length}`
        );
        setBankTransactions(bankStmts);
        setBookTransactions(bookRecords);
      } else {
        console.error("❌ Failed to fetch transactions:", response.status);
      }
    } catch (error) {
      console.error("❌ Error fetching transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleMatchTransaction = (bankId: number, bookId: number) => {
    setMatchedTransactions((prev) => new Set([...prev, bankId, bookId]));
    toast.success("Transactions matched successfully!");
  };

  const handleUnmatchTransaction = (transactionId: number) => {
    setMatchedTransactions((prev) => {
      const newSet = new Set(prev);
      newSet.delete(transactionId);
      return newSet;
    });
    toast.success("Transaction unmatched!");
  };

  const isTransactionMatched = (transactionId: number) => {
    return matchedTransactions.has(transactionId);
  };

  const formatAmount = (amount: number, type: string) => {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

    return type === "credit" ? formatted : `-${formatted}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTransactionStatus = (transaction: Transaction) => {
    if (matchedTransactions.has(transaction.id)) {
      return "bg-green-100 border-green-300";
    }
    return "bg-white border-gray-200";
  };

  return (
    <div className="p-6">
      {/* Account Selector */}
      <div className="mb-6">
        <label
          htmlFor="account-select"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Select Account
        </label>
        <select
          id="account-select"
          value={selectedAccount || ""}
          onChange={(e) => setSelectedAccount(Number(e.target.value))}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} - {account.account_number}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bank Statements - Left Side */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Bank Statements
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {bankTransactions.length} transactions
              </p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {bankTransactions.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No bank transactions found
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {bankTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className={`p-4 border-l-4 ${getTransactionStatus(
                        transaction
                      )} hover:bg-gray-50 transition-colors`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 text-sm">
                            {transaction.description}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(transaction.transaction_date)} •{" "}
                            {transaction.reference_number}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-semibold text-sm ${
                              transaction.transaction_type === "credit"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatAmount(
                              transaction.amount,
                              transaction.transaction_type
                            )}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {transaction.category}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Your Records - Right Side */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Your Records
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {bookTransactions.length} transactions
              </p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {bookTransactions.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No book transactions found
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {bookTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className={`p-4 border-l-4 ${getTransactionStatus(
                        transaction
                      )} hover:bg-gray-50 transition-colors`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 text-sm">
                            {transaction.description}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(transaction.transaction_date)} •{" "}
                            {transaction.reference_number}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-semibold text-sm ${
                              transaction.transaction_type === "credit"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatAmount(
                              transaction.amount,
                              transaction.transaction_type
                            )}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {transaction.category}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {!loading &&
        (bankTransactions.length > 0 || bookTransactions.length > 0) && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reconciliation Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {bankTransactions.length}
                </p>
                <p className="text-sm text-gray-600">Bank Transactions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {bookTransactions.length}
                </p>
                <p className="text-sm text-gray-600">Book Transactions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {matchedTransactions.size / 2}
                </p>
                <p className="text-sm text-gray-600">Matched Pairs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {bankTransactions.length +
                    bookTransactions.length -
                    matchedTransactions.size}
                </p>
                <p className="text-sm text-gray-600">Unmatched</p>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default ReconciliationPage;
