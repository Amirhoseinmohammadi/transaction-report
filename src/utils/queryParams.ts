import type { TransactionQuery, TransactionStatus } from '@/types/transaction'

const VALID_STATUSES: readonly TransactionStatus[] = ['Successful', 'Failed', 'Pending']

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

export type ParsedQueryParams = Partial<Omit<TransactionQuery, 'pageSize'>>

export function parseQueryParams(
  params: URLSearchParams | Record<string, unknown>,
): ParsedQueryParams {
  const get = (key: string): string | null => {
    if (params instanceof URLSearchParams) return params.get(key)
    const val = params[key]
    if (Array.isArray(val)) return typeof val[0] === 'string' ? val[0] : null
    return typeof val === 'string' ? val : null
  }

  const result: ParsedQueryParams = {}

  const search = get('search')?.trim()
  if (search) {
    result.search = search
  }

  const status = get('status')
  if (status && (VALID_STATUSES as readonly string[]).includes(status)) {
    result.status = status as TransactionStatus
  }

  const fromDate = get('fromDate')
  if (fromDate && isValidDate(fromDate)) {
    result.fromDate = fromDate
  }

  const toDate = get('toDate')
  if (toDate && isValidDate(toDate)) {
    result.toDate = toDate
  }

  const pageStr = get('page')
  if (pageStr !== null) {
    const page = parseInt(pageStr, 10)
    result.page = Number.isFinite(page) && page >= 1 ? page : 1
  }

  const mockError = get('mockError')
  if (mockError === 'true' || mockError === '1') {
    result.mockError = true
  }

  return result
}

export function buildQueryParams(
  query: TransactionQuery,
): Record<string, string> {
  const params: Record<string, string> = {}

  if (query.search) params.search = query.search
  if (query.status) params.status = query.status
  if (query.fromDate) params.fromDate = query.fromDate
  if (query.toDate) params.toDate = query.toDate
  if (query.page > 1) params.page = String(query.page)
  if (query.mockError) params.mockError = 'true'

  return params
}

export function queryParamsEqual(
  a: Record<string, string>,
  b: Record<string, string>,
): boolean {
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  return keysA.every((key) => a[key] === b[key])
}
