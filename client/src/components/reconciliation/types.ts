export interface Transaction {
  id: number;
  account_id: number;
  transaction_date: string;
  description: string;
  amount: number;
  transaction_type: "credit" | "debit";
  reference_number: string;
  category: string;
  is_reconciled: boolean;
  source: "bank" | "book";
}

export interface Account {
  id: number;
  name: string;
  account_number: string;
  account_type: string;
  balance: number;
  currency: string;
  is_active: boolean;
}

export interface ConnectionLine {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  type: "bank" | "book";
}
