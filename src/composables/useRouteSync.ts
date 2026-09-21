import { watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTransactionStore } from '@/stores/transaction.store'
import { parseQueryParams, buildQueryParams, queryParamsEqual } from '@/utils/queryParams'

export function useRouteSync() {
  const router = useRouter()
  const route = useRoute()
  const store = useTransactionStore()

  function getRouteParams(): Record<string, string> {
    const parsed = parseQueryParams(route.query)
    return buildQueryParams({
      page: parsed.page ?? 1,
      pageSize: store.query.pageSize,
      search: parsed.search,
      status: parsed.status,
      fromDate: parsed.fromDate,
      toDate: parsed.toDate,
    })
  }

  const initialParams = parseQueryParams(route.query)
  if (initialParams.search !== undefined) store.query.search = initialParams.search
  if (initialParams.status !== undefined) store.query.status = initialParams.status
  if (initialParams.fromDate !== undefined) store.query.fromDate = initialParams.fromDate
  if (initialParams.toDate !== undefined) store.query.toDate = initialParams.toDate
  if (initialParams.page !== undefined) store.query.page = initialParams.page

  store.fetchTransactions()

  watch(
    () => ({ ...store.query }),
    (newQuery, oldQuery) => {
      const newParams = buildQueryParams(newQuery)
      const oldParams = buildQueryParams(oldQuery)

      if (queryParamsEqual(newParams, oldParams)) return
      if (queryParamsEqual(newParams, getRouteParams())) return

      const pageChanged = newQuery.page !== oldQuery.page
      const filtersChanged =
        newQuery.search !== oldQuery.search ||
        newQuery.status !== oldQuery.status ||
        newQuery.fromDate !== oldQuery.fromDate ||
        newQuery.toDate !== oldQuery.toDate

      if (pageChanged && !filtersChanged) {
        router.push({ query: newParams })
      } else {
        router.replace({ query: newParams })
      }
    },
  )

  watch(
    () => route.query,
    () => {
      const routeParams = getRouteParams()
      const storeParams = buildQueryParams(store.query)

      if (queryParamsEqual(routeParams, storeParams)) return

      const parsed = parseQueryParams(route.query)
      store.query.search = parsed.search ?? ''
      store.query.status = parsed.status
      store.query.fromDate = parsed.fromDate ?? ''
      store.query.toDate = parsed.toDate ?? ''
      store.query.page = parsed.page ?? 1

      store.fetchTransactions()
    },
  )
}
