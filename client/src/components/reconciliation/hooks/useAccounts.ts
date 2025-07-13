import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Account } from "../types";

export const useAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);

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

  useEffect(() => {
    fetchAccounts();
  }, []);

  return { accounts, selectedAccount, setSelectedAccount };
};
