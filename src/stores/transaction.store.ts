import { defineStore } from 'pinia'
import type {
  Transaction,
  TransactionQuery,
} from '@/types/transaction'
import { MockTransactionService } from '@/services/transaction.service'

const transactionService = new MockTransactionService()

export const useTransactionStore = defineStore('transaction', {
  state: () => ({
    transactions: [] as Transaction[],
    totalCount: 0,
    loading: false,
    error: null as string | null,

    query: {
      page: 1,
      pageSize: 10,
      search: '',
      status: undefined,
      fromDate: '',
      toDate: '',
    } as TransactionQuery,
  }),

  actions: {
    async fetchTransactions() {
      this.loading = true
      this.error = null

      try {
        const response = await transactionService.getTransactions(
          this.query,
        )

        this.transactions = response.data
        this.totalCount = response.totalCount
      } catch (error) {
        this.error =
          error instanceof Error
            ? error.message
            : 'Failed to load transactions'
      } finally {
        this.loading = false
      }
    },

    async setPage(page: number) {
      this.query.page = page
      await this.fetchTransactions()
    },

    async setSearch(search: string) {
      this.query.search = search
      this.query.page = 1
      await this.fetchTransactions()
    },

    async setStatus(status: TransactionQuery['status']) {
      this.query.status = status
      this.query.page = 1
      await this.fetchTransactions()
    },
  },
})