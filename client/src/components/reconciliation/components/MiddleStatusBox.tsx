import React from "react";
import { Transaction } from "../types";

interface MiddleStatusBoxProps {
  selectedBankTransactions: Transaction[];
  selectedBookTransactions: Transaction[];
  middleBoxRef: React.RefObject<HTMLDivElement>;
  onMatchSelected: () => void;
  onCancelMatching: () => void;
}

export const MiddleStatusBox: React.FC<MiddleStatusBoxProps> = ({
  selectedBankTransactions,
  selectedBookTransactions,
  middleBoxRef,
  onMatchSelected,
  onCancelMatching,
}) => {
  const calculateTotals = () => {
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

    return { bankTotal, bookTotal, canMatch: bankTotal === bookTotal };
  };

  const { canMatch: amountsMatch } = calculateTotals();

  return (
    <div className="hidden lg:flex flex-col items-center justify-center">
      <div
        ref={middleBoxRef}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 min-w-[200px]"
      >
        {selectedBankTransactions.length > 0 &&
        selectedBookTransactions.length > 0 ? (
          (() => {
            const { canMatch } = calculateTotals();
            return (
              <div className="text-center">
                <div
                  className={`flex items-center justify-center w-16 h-16 rounded-full shadow text-3xl border-4 mx-auto mb-4 ${
                    canMatch
                      ? "bg-green-100 border-green-400 text-green-600"
                      : "bg-red-100 border-red-400 text-red-600"
                  }`}
                >
                  {canMatch ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </div>

                {/* Match and Cancel Buttons */}
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={onMatchSelected}
                    disabled={!canMatch || !amountsMatch}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Match Selected
                  </button>
                  <button
                    onClick={onCancelMatching}
                    className="px-3 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full shadow text-3xl border-4 mx-auto mb-4 bg-gray-100 border-gray-300 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </div>
            <div className="text-lg font-semibold mb-2 text-gray-600">
              Select from both sides
            </div>
            <div className="text-sm text-gray-500">
              Choose transactions to match
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
