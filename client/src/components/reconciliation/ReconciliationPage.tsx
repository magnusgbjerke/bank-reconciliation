import React, { useState, useRef } from "react";
import { toast } from "react-hot-toast";
import { Transaction } from "./types";
import { useAccounts } from "./hooks/useAccounts";
import { useTransactions } from "./hooks/useTransactions";
import { useConnectionLines } from "./hooks/useConnectionLines";
import { AccountSelector } from "./components/AccountSelector";
import { MatchingControls } from "./components/MatchingControls";
import { ConnectionLines } from "./components/ConnectionLines";
import { TransactionList } from "./components/TransactionList";
import { MiddleStatusBox } from "./components/MiddleStatusBox";

const ReconciliationPage: React.FC = () => {
  const [selectedBankTransactions, setSelectedBankTransactions] = useState<
    Transaction[]
  >([]);
  const [selectedBookTransactions, setSelectedBookTransactions] = useState<
    Transaction[]
  >([]);
  const [matchedTransactions, setMatchedTransactions] = useState<Set<number>>(
    new Set()
  );

  const middleBoxRef = useRef<HTMLDivElement | null>(null);

  // Custom hooks
  const { accounts, selectedAccount, setSelectedAccount } = useAccounts();
  const { bankTransactions, bookTransactions, loading } =
    useTransactions(selectedAccount);
  const { connectionLines, transactionRefs } = useConnectionLines(
    selectedBankTransactions,
    selectedBookTransactions,
    middleBoxRef
  );

  // Selection handlers
  const handleSelectBankTransaction = (transaction: Transaction) => {
    setSelectedBankTransactions((prev) => {
      const isSelected = prev.some((t) => t.id === transaction.id);
      if (isSelected) {
        return prev.filter((t) => t.id !== transaction.id);
      } else {
        return [...prev, transaction];
      }
    });
  };

  const handleSelectBookTransaction = (transaction: Transaction) => {
    setSelectedBookTransactions((prev) => {
      const isSelected = prev.some((t) => t.id === transaction.id);
      if (isSelected) {
        return prev.filter((t) => t.id !== transaction.id);
      } else {
        return [...prev, transaction];
      }
    });
  };

  // Matching handlers
  const handleMatchSelectedTransactions = () => {
    if (
      selectedBankTransactions.length === 0 ||
      selectedBookTransactions.length === 0
    ) {
      return;
    }

    const bankTotal = selectedBankTransactions.reduce((sum, trans) => {
      const numericAmount =
        typeof trans.amount === "string"
          ? parseFloat(trans.amount)
          : trans.amount;
      const amount =
        trans.transaction_type === "credit" ? numericAmount : -numericAmount;
      return sum + amount;
    }, 0);

    const bookTotal = selectedBookTransactions.reduce((sum, trans) => {
      const numericAmount =
        typeof trans.amount === "string"
          ? parseFloat(trans.amount)
          : trans.amount;
      const amount =
        trans.transaction_type === "credit" ? numericAmount : -numericAmount;
      return sum + amount;
    }, 0);

    if (bankTotal !== bookTotal) {
      return;
    }

    setMatchedTransactions(
      (prev) =>
        new Set([
          ...Array.from(prev),
          ...selectedBankTransactions.map((t) => t.id),
          ...selectedBookTransactions.map((t) => t.id),
        ])
    );
    toast.success("Transactions matched successfully!");
    setSelectedBankTransactions([]);
    setSelectedBookTransactions([]);
  };

  const handleCancelMatching = () => {
    setSelectedBankTransactions([]);
    setSelectedBookTransactions([]);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <AccountSelector
        accounts={accounts}
        selectedAccount={selectedAccount}
        onAccountChange={setSelectedAccount}
      />

      <MatchingControls
        selectedBankTransactions={selectedBankTransactions}
        selectedBookTransactions={selectedBookTransactions}
        onMatchSelected={handleMatchSelectedTransactions}
        onCancelMatching={handleCancelMatching}
      />

      <div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative"
        id="reconciliation-grid"
      >
        <ConnectionLines connectionLines={connectionLines} />

        <TransactionList
          title="Bank Statements"
          transactions={bankTransactions}
          selectedTransactions={selectedBankTransactions}
          matchedTransactions={matchedTransactions}
          onTransactionClick={handleSelectBankTransaction}
          transactionRefs={transactionRefs}
        />

        <MiddleStatusBox
          selectedBankTransactions={selectedBankTransactions}
          selectedBookTransactions={selectedBookTransactions}
          middleBoxRef={middleBoxRef}
        />

        <TransactionList
          title="Your Records"
          transactions={bookTransactions}
          selectedTransactions={selectedBookTransactions}
          matchedTransactions={matchedTransactions}
          onTransactionClick={handleSelectBookTransaction}
          transactionRefs={transactionRefs}
        />
      </div>
    </>
  );
};

export default ReconciliationPage;
