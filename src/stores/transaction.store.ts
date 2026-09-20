import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  Transaction,
  TransactionQuery,
} from '@/types/transaction'
import { MockTransactionService } from '@/services/transaction.service'

const transactionService = new MockTransactionService()

export const useTransactionStore = defineStore('transaction', () => {
  const transactions = ref<Transaction[]>([])
  const totalCount = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const query = ref<TransactionQuery>({
    page: 1,
    pageSize: 10,
    search: '',
    status: undefined,
    fromDate: '',
    toDate: '',
  })
  
  let currentController: AbortController | null = null
  let requestId = 0

  async function fetchTransactions() {
    currentController?.abort()
    currentController = new AbortController()
    const { signal } = currentController

    const thisRequestId = ++requestId

    loading.value = true
    error.value = null

    try {
      const response = await transactionService.getTransactions(
        query.value,
        signal,
      )

      if (thisRequestId !== requestId) return

      transactions.value = response.data
      totalCount.value = response.totalCount
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return

      if (thisRequestId !== requestId) return

      error.value =
        err instanceof Error ? err.message : 'Failed to load transactions'
    } finally {
      if (thisRequestId === requestId) {
        loading.value = false
      }
    }
  }

  async function setPage(page: number) {
    query.value.page = page
    await fetchTransactions()
  }

  async function setSearch(search: string) {
    query.value.search = search
    query.value.page = 1
    await fetchTransactions()
  }

  async function setStatus(status: TransactionQuery['status']) {
    query.value.status = status
    query.value.page = 1
    await fetchTransactions()
  }

  async function setFromDate(fromDate: string) {
    query.value.fromDate = fromDate
    query.value.page = 1
    await fetchTransactions()
  }

  async function setToDate(toDate: string) {
    query.value.toDate = toDate
    query.value.page = 1
    await fetchTransactions()
  }

  return {
    transactions,
    totalCount,
    loading,
    error,
    query,
    fetchTransactions,
    setPage,
    setSearch,
    setStatus,
    setFromDate,
    setToDate,
  }
})