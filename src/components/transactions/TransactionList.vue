<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'

import { useTransactionStore } from '@/stores/transaction.store'

const transactionStore = useTransactionStore()

const { transactions, totalCount, loading, error } = storeToRefs(transactionStore)

const searchInput = ref('')

function onSearch() {
  transactionStore.setSearch(searchInput.value)
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
    </template>
  </section>
</template>