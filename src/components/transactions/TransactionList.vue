<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import { useTransactionStore } from '@/stores/transaction.store'

const transactionStore = useTransactionStore()

const { transactions, loading, error } = storeToRefs(transactionStore)

onMounted(() => {
  transactionStore.fetchTransactions()
})
</script>

<template>
  <section>
    <h2>Transactions</h2>

    <p v-if="loading">Loading...</p>

    <p v-else-if="error">
      {{ error }}
    </p>

    <ul v-else>
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
  </section>
</template>