import React from "react";
import { Transaction } from "../types";
import { TransactionItem } from "./TransactionItem";

interface TransactionListProps {
  title: string;
  transactions: Transaction[];
  selectedTransactions: Transaction[];
  matchedTransactions: Set<number>;
  onTransactionClick: (transaction: Transaction) => void;
  transactionRefs: React.MutableRefObject<{
    [key: number]: HTMLDivElement | null;
  }>;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  title,
  transactions,
  selectedTransactions,
  matchedTransactions,
  onTransactionClick,
  transactionRefs,
}) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 relative">
    <div className="px-6 py-4 border-b border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-600 mt-1">
        {transactions.length} transactions
      </p>
    </div>
    <div className="max-h-96">
      {transactions.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          No {title.toLowerCase()} found
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              ref={(el) => {
                transactionRefs.current[transaction.id] = el;
              }}
              transaction={transaction}
              isSelected={selectedTransactions.some(
                (t) => t.id === transaction.id
              )}
              isMatched={matchedTransactions.has(transaction.id)}
              onClick={() => onTransactionClick(transaction)}
            />
          ))}
        </div>
      )}
    </div>
  </div>
);
