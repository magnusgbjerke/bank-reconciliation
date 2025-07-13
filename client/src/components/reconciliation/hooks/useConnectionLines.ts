import { useState, useEffect, useRef } from "react";
import { Transaction, ConnectionLine } from "../types";

export const useConnectionLines = (
  selectedBankTransactions: Transaction[],
  selectedBookTransactions: Transaction[],
  middleBoxRef: React.RefObject<HTMLDivElement>
) => {
  const [connectionLines, setConnectionLines] = useState<ConnectionLine[]>([]);
  const transactionRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const calculateConnectionLines = () => {
    if (
      selectedBankTransactions.length > 0 &&
      selectedBookTransactions.length > 0 &&
      middleBoxRef.current
    ) {
      const middleBox = middleBoxRef.current.getBoundingClientRect();
      const newLines: ConnectionLine[] = [];

      // Calculate lines for bank transactions
      selectedBankTransactions.forEach((transaction) => {
        const element = transactionRefs.current[transaction.id];
        if (element) {
          const rect = element.getBoundingClientRect();
          const line = {
            id: `bank-${transaction.id}`,
            startX: rect.right,
            startY: rect.top + rect.height / 2,
            endX: middleBox.left,
            endY: middleBox.top + middleBox.height / 2,
            type: "bank" as const,
          };
          console.log(`Bank line for transaction ${transaction.id}:`, line);
          newLines.push(line);
        }
      });

      // Calculate lines for book transactions
      selectedBookTransactions.forEach((transaction) => {
        const element = transactionRefs.current[transaction.id];
        if (element) {
          const rect = element.getBoundingClientRect();
          const line = {
            id: `book-${transaction.id}`,
            startX: rect.left,
            startY: rect.top + rect.height / 2,
            endX: middleBox.right,
            endY: middleBox.top + middleBox.height / 2,
            type: "book" as const,
          };
          console.log(`Book line for transaction ${transaction.id}:`, line);
          newLines.push(line);
        }
      });

      console.log("Connection lines calculated:", newLines);
      setConnectionLines(newLines);
    } else {
      setConnectionLines([]);
    }
  };

  useEffect(() => {
    calculateConnectionLines();
  }, [selectedBankTransactions, selectedBookTransactions]);

  useEffect(() => {
    const handleResize = () => {
      calculateConnectionLines();
    };

    const handleScroll = () => {
      calculateConnectionLines();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [selectedBankTransactions, selectedBookTransactions]);

  return { connectionLines, transactionRefs };
};
