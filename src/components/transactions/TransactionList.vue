<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import { useTransactionStore } from '@/stores/transaction.store'
import { useRouteSync } from '@/composables/useRouteSync'
import type { TransactionQuery } from '@/types/transaction'
import { formatAmount, formatDate, formatCardNumber } from '@/utils/formatters'

const transactionStore = useTransactionStore()
useRouteSync()

const { transactions, totalCount, loading, error, query } = storeToRefs(transactionStore)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalCount.value / query.value.pageSize)),
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
  <main class="page-container">
    <header class="page-header">
      <div class="page-title-row">
        <h1 class="page-title">Transaction Reports</h1>
        <span v-if="!loading && !error" class="result-count-badge">
          {{ totalCount }} result{{ totalCount === 1 ? '' : 's' }}
        </span>
      </div>
      <p class="page-subtitle">
        Search, filter, and audit customer transaction histories and payment statuses.
      </p>
    </header>

    <section class="filter-card" aria-label="Transaction filters">
      <form class="filter-grid" @submit.prevent>
        <div class="filter-group">
          <label for="filter-search" class="filter-label">Search</label>
          <input
            id="filter-search"
            v-model="searchInput"
            type="search"
            class="form-control"
            placeholder="Customer name or card number..."
            @input="onSearch"
          />
        </div>

        <div class="filter-group">
          <label for="filter-status" class="filter-label">Status</label>
          <select
            id="filter-status"
            class="form-control"
            :value="query.status || ''"
            @change="onStatusChange"
          >
            <option value="">All Statuses</option>
            <option value="Successful">Successful</option>
            <option value="Failed">Failed</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="filter-from-date" class="filter-label">From Date</label>
          <input
            id="filter-from-date"
            class="form-control"
            :value="query.fromDate || ''"
            type="date"
            @change="onFromDateChange"
          />
        </div>

        <div class="filter-group">
          <label for="filter-to-date" class="filter-label">To Date</label>
          <input
            id="filter-to-date"
            class="form-control"
            :value="query.toDate || ''"
            type="date"
            @change="onToDateChange"
          />
        </div>
      </form>
    </section>

    <section
      v-if="error"
      class="state-error-banner"
      role="alert"
      aria-live="assertive"
    >
      <svg
        class="state-error-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <div class="state-error-content">
        <h2 class="state-error-title">Failed to load transactions</h2>
        <p class="state-error-message">{{ error }}</p>
        <button
          type="button"
          class="btn btn-retry"
          @click="transactionStore.fetchTransactions()"
        >
          Retry
        </button>
      </div>
    </section>

    <section v-else class="table-card" aria-label="Transactions table">
      <div
        v-if="loading"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span class="sr-only">Loading transactions...</span>
        <div class="table-wrapper">
          <table class="transaction-table" aria-hidden="true">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Customer</th>
                <th scope="col">Card Number</th>
                <th scope="col">Date</th>
                <th scope="col" class="th-amount">Amount</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="index in query.pageSize || 10"
                :key="index"
                class="skeleton-row"
              >
                <td><div class="skeleton-box skeleton-w-sm"></div></td>
                <td><div class="skeleton-box skeleton-w-lg"></div></td>
                <td><div class="skeleton-box skeleton-w-md"></div></td>
                <td><div class="skeleton-box skeleton-w-md"></div></td>
                <td><div class="skeleton-box skeleton-w-sm" style="margin-left: auto;"></div></td>
                <td><div class="skeleton-box skeleton-w-sm"></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        v-else-if="totalCount === 0"
        class="state-empty"
        role="status"
      >
        <svg
          class="state-empty-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
        <h2 class="state-empty-title">No transactions found</h2>
        <p class="state-empty-desc">
          We couldn't find any transactions matching your current filters. Try adjusting your search query, status, or date range.
        </p>
      </div>

      <template v-else>
        <div class="table-wrapper">
          <table class="transaction-table">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Customer</th>
                <th scope="col">Card Number</th>
                <th scope="col">Date</th>
                <th scope="col" class="th-amount">Amount</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="transaction in transactions"
                :key="transaction.id"
              >
                <td class="col-id">#{{ transaction.id }}</td>
                <td class="col-customer">{{ transaction.customerName }}</td>
                <td class="col-card">{{ formatCardNumber(transaction.cardNumber) }}</td>
                <td class="col-date">{{ formatDate(transaction.transactionDate) }}</td>
                <td class="col-amount">{{ formatAmount(transaction.amount) }}</td>
                <td>
                  <span
                    :class="[
                      'status-badge',
                      'status-' + transaction.status.toLowerCase(),
                    ]"
                  >
                    <span class="badge-dot" aria-hidden="true"></span>
                    {{ transaction.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer class="pagination-container" aria-label="Pagination">
          <div class="pagination-info">
            Showing page <strong>{{ currentPage }}</strong> of
            <strong>{{ totalPages }}</strong>
          </div>

          <div class="pagination-actions">
            <button
              type="button"
              class="btn"
              :disabled="currentPage <= 1"
              :aria-disabled="currentPage <= 1"
              @click="onPrevPage"
            >
              ← Previous
            </button>

            <button
              type="button"
              class="btn"
              :disabled="currentPage >= totalPages"
              :aria-disabled="currentPage >= totalPages"
              @click="onNextPage"
            >
              Next →
            </button>
          </div>
        </footer>
      </template>
    </section>
  </main>
</template>