import React from "react";
import { Account } from "../types";

interface AccountSelectorProps {
  accounts: Account[];
  selectedAccount: number | null;
  onAccountChange: (accountId: number) => void;
}

export const AccountSelector: React.FC<AccountSelectorProps> = ({
  accounts,
  selectedAccount,
  onAccountChange,
}) => (
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
      onChange={(e) => onAccountChange(Number(e.target.value))}
      className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      {accounts.map((account) => (
        <option key={account.id} value={account.id}>
          {account.name} - {account.account_number}
        </option>
      ))}
    </select>
  </div>
);
