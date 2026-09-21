<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import { useTransactionStore } from '@/stores/transaction.store'
import { useRouteSync } from '@/composables/useRouteSync'
import type { TransactionQuery } from '@/types/transaction'

const transactionStore = useTransactionStore()
useRouteSync()

const { transactions, totalCount, loading, error, query } = storeToRefs(transactionStore)

const totalPages = computed(() =>
  Math.ceil(totalCount.value / query.value.pageSize),
)

const currentPage = computed(() => query.value.page)

function onPrevPage() {
  transactionStore.setPage(currentPage.value - 1)
}

function onNextPage() {
  transactionStore.setPage(currentPage.value + 1)
}

const searchInput = ref(query.value.search ?? '')
let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => query.value.search,
  (newSearch) => {
    clearTimeout(searchDebounceTimer)
    searchInput.value = newSearch ?? ''
  },
)

function onSearch() {
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    transactionStore.setSearch(searchInput.value)
  }, 300)
}

function onStatusChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  transactionStore.setStatus((value as TransactionQuery['status']) || undefined)
}

function onFromDateChange(event: Event) {
  const value = (event.target as HTMLInputElement).value
  transactionStore.setFromDate(value)
}

function onToDateChange(event: Event) {
  const value = (event.target as HTMLInputElement).value
  transactionStore.setToDate(value)
}

onUnmounted(() => {
  clearTimeout(searchDebounceTimer)
})
</script>

<template>
  <section>
    <h2>Transactions</h2>

    <input
      v-model="searchInput"
      type="search"
      placeholder="Search by customer or card number"
      @input="onSearch"
    />

    <select
      :value="query.status || ''"
      @change="onStatusChange"
    >
      <option value="">All</option>
      <option value="Successful">Successful</option>
      <option value="Failed">Failed</option>
      <option value="Pending">Pending</option>
    </select>

    <label>
      From
      <input
        :value="query.fromDate || ''"
        type="date"
        @change="onFromDateChange"
      />
    </label>

    <label>
      To
      <input
        :value="query.toDate || ''"
        type="date"
        @change="onToDateChange"
      />
    </label>

    <p v-if="loading" role="status" aria-live="polite">Loading...</p>

    <div v-else-if="error" role="alert">
      <p>{{ error }}</p>
      <button type="button" @click="transactionStore.fetchTransactions()">Retry</button>
    </div>

    <template v-else>
      <p v-if="totalCount === 0" role="status">No transactions found.</p>

      <template v-else>
        <p>{{ totalCount }} result(s)</p>

        <ul>
          <li
            v-for="transaction in transactions"
            :key="transaction.id"
          >
            {{ transaction.customerName }}
            -
            {{ transaction.amount }}
            -
            {{ transaction.status }}
          </li>
        </ul>

        <div>
          <button
            :disabled="currentPage <= 1"
            @click="onPrevPage"
          >
            Previous
          </button>

          <span>Page {{ currentPage }} of {{ totalPages }}</span>

          <button
            :disabled="currentPage >= totalPages"
            @click="onNextPage"
          >
            Next
          </button>
        </div>
      </template>
    </template>
  </section>
</template>