import { createRouter, createWebHistory } from 'vue-router'
import TransactionList from '@/components/transactions/TransactionList.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/transactions',
      component: TransactionList,
    },
    {
      path: '/',
      redirect: (to) => ({ path: '/transactions', query: to.query }),
    },
  ],
})

export default router
