import {
  Account,
  Transaction,
  ReconciliationRecord,
  ReconciliationDetails,
  AccountSummary,
  BalanceHistory,
  TransactionsResponse,
  AccountsResponse,
  ReconciliationsResponse,
  CreateTransactionRequest,
  CreateAccountRequest,
  CreateReconciliationRequest,
  MatchTransactionsRequest,
  ApiResponse,
} from "../types";

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = "/api";
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<any> {
    return this.request("/health");
  }

  // Account endpoints
  async getAccounts(isActive?: boolean): Promise<AccountsResponse> {
    const params = new URLSearchParams();
    if (isActive !== undefined) {
      params.append("isActive", isActive.toString());
    }
    const queryString = params.toString();
    const endpoint = queryString ? `/accounts?${queryString}` : "/accounts";
    return this.request<AccountsResponse>(endpoint);
  }

  async getAccount(id: number): Promise<AccountSummary> {
    return this.request<AccountSummary>(`/accounts/${id}`);
  }

  async createAccount(
    data: CreateAccountRequest
  ): Promise<{ account: Account; message: string }> {
    return this.request<{ account: Account; message: string }>("/accounts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateAccount(
    id: number,
    data: CreateAccountRequest
  ): Promise<{ account: Account; message: string }> {
    return this.request<{ account: Account; message: string }>(
      `/accounts/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  }

  async deleteAccount(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/accounts/${id}`, {
      method: "DELETE",
    });
  }

  async getAccountBalanceHistory(
    id: number,
    startDate?: string,
    endDate?: string
  ): Promise<{ balanceHistory: BalanceHistory[] }> {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const queryString = params.toString();
    const endpoint = queryString
      ? `/accounts/${id}/balance-history?${queryString}`
      : `/accounts/${id}/balance-history`;
    return this.request<{ balanceHistory: BalanceHistory[] }>(endpoint);
  }

  // Transaction endpoints
  async getTransactions(
    accountId: number,
    page = 1,
    limit = 20,
    status?: string,
    startDate?: string,
    endDate?: string
  ): Promise<TransactionsResponse> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (status) params.append("status", status);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const queryString = params.toString();
    const endpoint = `/transactions/account/${accountId}?${queryString}`;
    return this.request<TransactionsResponse>(endpoint);
  }

  async createTransaction(
    data: CreateTransactionRequest
  ): Promise<{ transaction: Transaction; message: string }> {
    return this.request<{ transaction: Transaction; message: string }>(
      "/transactions",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  async updateTransaction(
    id: number,
    data: CreateTransactionRequest
  ): Promise<{ transaction: Transaction; message: string }> {
    return this.request<{ transaction: Transaction; message: string }>(
      `/transactions/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  }

  async deleteTransaction(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/transactions/${id}`, {
      method: "DELETE",
    });
  }

  async importTransactions(
    accountId: number,
    file: File
  ): Promise<{ message: string; imported: number; errors?: string[] }> {
    const formData = new FormData();
    formData.append("file", file);

    return this.request<{
      message: string;
      imported: number;
      errors?: string[];
    }>(`/transactions/import/${accountId}`, {
      method: "POST",
      headers: {
        // Don't set Content-Type for FormData, let the browser set it with boundary
      },
      body: formData,
    });
  }

  // Reconciliation endpoints
  async getReconciliations(
    accountId: number,
    status?: string,
    startDate?: string,
    endDate?: string
  ): Promise<ReconciliationsResponse> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const queryString = params.toString();
    const endpoint = queryString
      ? `/reconciliation/account/${accountId}?${queryString}`
      : `/reconciliation/account/${accountId}`;
    return this.request<ReconciliationsResponse>(endpoint);
  }

  async getReconciliationDetails(id: number): Promise<ReconciliationDetails> {
    return this.request<ReconciliationDetails>(`/reconciliation/${id}`);
  }

  async createReconciliation(
    data: CreateReconciliationRequest
  ): Promise<{ reconciliation: ReconciliationRecord; message: string }> {
    return this.request<{
      reconciliation: ReconciliationRecord;
      message: string;
    }>("/reconciliation", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateReconciliationStatus(
    id: number,
    status: string
  ): Promise<{ reconciliation: ReconciliationRecord; message: string }> {
    return this.request<{
      reconciliation: ReconciliationRecord;
      message: string;
    }>(`/reconciliation/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  async matchTransactions(
    reconciliationId: number,
    data: MatchTransactionsRequest
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      `/reconciliation/${reconciliationId}/match`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  async autoMatchTransactions(
    reconciliationId: number
  ): Promise<{ message: string; matches: any[] }> {
    return this.request<{ message: string; matches: any[] }>(
      `/reconciliation/${reconciliationId}/auto-match`,
      {
        method: "POST",
      }
    );
  }
}

export const apiService = new ApiService();
export default apiService;
