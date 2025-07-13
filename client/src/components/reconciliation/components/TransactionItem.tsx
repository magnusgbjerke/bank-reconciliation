import React from "react";
import { Transaction } from "../types";

interface TransactionItemProps {
  transaction: Transaction;
  isSelected: boolean;
  isMatched: boolean;
  onClick: () => void;
}

export const TransactionItem = React.forwardRef<
  HTMLDivElement,
  TransactionItemProps
>(({ transaction, isSelected, isMatched, onClick }, ref) => {
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

  const getTransactionClasses = () => {
    let classes = "p-4 border-l-4 transition-colors cursor-pointer";
    if (isMatched) {
      classes += " bg-green-100 border-green-300 hover:bg-green-200";
    } else if (isSelected) {
      classes += " bg-blue-100 border-blue-300 hover:bg-blue-200";
    } else {
      classes += " bg-white border-gray-200 hover:bg-gray-50";
    }
    return classes;
  };

  return (
    <div ref={ref} className={getTransactionClasses()} onClick={onClick}>
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
            {formatAmount(transaction.amount, transaction.transaction_type)}
          </span>
          <p className="text-xs text-gray-500 mt-1">{transaction.category}</p>
        </div>
      </div>
    </div>
  );
});

TransactionItem.displayName = "TransactionItem";
