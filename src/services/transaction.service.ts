import type {
  TransactionQuery,
  TransactionResponse,
} from '@/types/transaction'

export interface TransactionService {
  getTransactions(
    query: TransactionQuery,
    signal?: AbortSignal,
  ): Promise<TransactionResponse>
}

export class HttpTransactionService implements TransactionService {
  private readonly baseUrl: string

  constructor(baseUrl = '/api/transactions') {
    this.baseUrl = baseUrl
  }

  async getTransactions(
    query: TransactionQuery,
    signal?: AbortSignal,
  ): Promise<TransactionResponse> {
    const params = new URLSearchParams()

    params.set('page', String(query.page))
    params.set('pageSize', String(query.pageSize))

    if (query.search) {
      params.set('search', query.search)
    }

    if (query.status) {
      params.set('status', query.status)
    }

    if (query.fromDate) {
      params.set('fromDate', query.fromDate)
    }

    if (query.toDate) {
      params.set('toDate', query.toDate)
    }

    const url = `${this.baseUrl}?${params.toString()}`

    const response = await fetch(url, { signal })

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}: ${response.statusText}`
      try {
        const errorData = await response.json()
        if (errorData && typeof errorData === 'object' && 'error' in errorData) {
          errorMessage = String(errorData.error)
        }
      } catch {
        // Fallback to HTTP status text if body is not JSON
      }
      throw new Error(errorMessage)
    }

    return (await response.json()) as TransactionResponse
  }
}