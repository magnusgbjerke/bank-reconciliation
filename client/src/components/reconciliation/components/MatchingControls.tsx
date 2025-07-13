import React from "react";
import { Transaction } from "../types";

interface MatchingControlsProps {
  selectedBankTransactions: Transaction[];
  selectedBookTransactions: Transaction[];
  onMatchSelected: () => void;
  onCancelMatching: () => void;
}

export const MatchingControls: React.FC<MatchingControlsProps> = ({
  selectedBankTransactions,
  selectedBookTransactions,
  onMatchSelected,
  onCancelMatching,
}) => (
  <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Matching Controls
        </h3>
        <p className="text-sm text-gray-600">
          Click transactions from both sides to select and match them
        </p>
      </div>
      <div className="flex space-x-3">
        <button
          onClick={onMatchSelected}
          disabled={
            selectedBankTransactions.length === 0 ||
            selectedBookTransactions.length === 0
          }
          className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Match Selected
        </button>
        <button
          onClick={onCancelMatching}
          className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>

    <div className="mt-4 p-3 bg-gray-50 rounded-md">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium">Bank Transactions Selected:</span>
          <span className="ml-2">
            {selectedBankTransactions.length} transaction
            {selectedBankTransactions.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div>
          <span className="font-medium">Book Transactions Selected:</span>
          <span className="ml-2">
            {selectedBookTransactions.length} transaction
            {selectedBookTransactions.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  </div>
);
