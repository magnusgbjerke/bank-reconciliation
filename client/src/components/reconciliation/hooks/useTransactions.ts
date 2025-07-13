import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Transaction } from "../types";

export const useTransactions = (selectedAccount: number | null) => {
  const [bankTransactions, setBankTransactions] = useState<Transaction[]>([]);
  const [bookTransactions, setBookTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (selectedAccount) {
      fetchTransactions(selectedAccount);
    }
  }, [selectedAccount]);

  return { bankTransactions, bookTransactions, loading };
};
