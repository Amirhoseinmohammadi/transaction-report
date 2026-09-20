<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'

import { useTransactionStore } from '@/stores/transaction.store'
import type { TransactionQuery } from '@/types/transaction'

const transactionStore = useTransactionStore()

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

const searchInput = ref('')
const statusSelect = ref<TransactionQuery['status'] | ''>('')

function onSearch() {
  transactionStore.setSearch(searchInput.value)
}

function onStatusChange() {
  transactionStore.setStatus(statusSelect.value || undefined)
}

const fromDate = ref('')
const toDate = ref('')

function onFromDateChange() {
  transactionStore.setFromDate(fromDate.value)
}

function onToDateChange() {
  transactionStore.setToDate(toDate.value)
}

onMounted(() => {
  transactionStore.fetchTransactions()
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
      v-model="statusSelect"
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
        v-model="fromDate"
        type="date"
        @change="onFromDateChange"
      />
    </label>

    <label>
      To
      <input
        v-model="toDate"
        type="date"
        @change="onToDateChange"
      />
    </label>

    <p v-if="loading">Loading...</p>

    <p v-else-if="error">
      {{ error }}
    </p>

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
  </section>
</template>