import type {
  TransactionQuery,
  TransactionResponse,
} from '@/types/transaction'

import { transactions } from '@/mocks/transactions'

export interface TransactionService {
  getTransactions(
    query: TransactionQuery,
    signal?: AbortSignal,
  ): Promise<TransactionResponse>
}

export class MockTransactionService implements TransactionService {
  async getTransactions(
    query: TransactionQuery,
    signal?: AbortSignal,
  ): Promise<TransactionResponse> {
    if (signal?.aborted) {
      throw new DOMException('Request aborted', 'AbortError')
    }

    await new Promise((resolve) => setTimeout(resolve, 300))

    let result = [...transactions]

    if (query.search) {
      const search = query.search.toLowerCase()

      result = result.filter(
        (transaction) =>
          transaction.customerName.toLowerCase().includes(search) ||
          transaction.cardNumber.toLowerCase().includes(search),
      )
    }

    if (query.status) {
      result = result.filter(
        (transaction) => transaction.status === query.status,
      )
    }

    const totalCount = result.length

    const start = (query.page - 1) * query.pageSize
    const end = start + query.pageSize

    result = result.slice(start, end)

    return {
      data: result,
      totalCount,
    }
  }
}