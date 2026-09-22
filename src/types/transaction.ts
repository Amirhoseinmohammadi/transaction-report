export type TransactionStatus = 'Successful' | 'Failed' | 'Pending'

export interface Transaction {
  id: number
  cardNumber: string
  amount: number
  status: TransactionStatus
  transactionDate: string
  customerName: string
}

export interface TransactionQuery {
  page: number
  pageSize: number
  search?: string
  status?: TransactionStatus
  fromDate?: string
  toDate?: string
  mockError?: boolean
}

export interface TransactionResponse {
  data: Transaction[]
  totalCount: number
}