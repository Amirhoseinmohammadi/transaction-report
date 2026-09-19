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