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

function simulateLatency(
  minMs: number,
  maxMs: number,
  signal?: AbortSignal,
): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs

  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, delay)

    if (signal) {
      const onAbort = () => {
        clearTimeout(timer)
        reject(new DOMException('Request aborted', 'AbortError'))
      }

      if (signal.aborted) {
        clearTimeout(timer)
        reject(new DOMException('Request aborted', 'AbortError'))
        return
      }

      signal.addEventListener('abort', onAbort, { once: true })
    }
  })
}

export class MockTransactionService implements TransactionService {
  async getTransactions(
    query: TransactionQuery,
    signal?: AbortSignal,
  ): Promise<TransactionResponse> {
    if (signal?.aborted) {
      throw new DOMException('Request aborted', 'AbortError')
    }

    await simulateLatency(200, 800, signal)

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

    if (query.fromDate) {
      const from = new Date(query.fromDate)
      from.setHours(0, 0, 0, 0)
      result = result.filter(
        (transaction) => new Date(transaction.transactionDate) >= from,
      )
    }

    if (query.toDate) {
      const to = new Date(query.toDate)
      to.setHours(23, 59, 59, 999)
      result = result.filter(
        (transaction) => new Date(transaction.transactionDate) <= to,
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