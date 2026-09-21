import type { Transaction } from '../types/transaction.ts'

const customers = [
  'Ali Ahmadi',
  'Sara Mohammadi',
  'Reza Karimi',
  'Maryam Ahmadi',
  'Mohammad Rezaei',
  'Nima Hosseini',
  'Sara Karimi',
  'Amir Rahimi',
]

const statuses: Transaction['status'][] = [
  'Successful',
  'Failed',
  'Pending',
]

const generateCardNumber = (index: number) => {
  const prefixes = ['6037', '5892', '6274', '6219']

  const prefix = prefixes[index % prefixes.length]

  return `${prefix}********${String(1000 + index).slice(-4)}`
}

const generateDate = (index: number) => {
  const day = 1 + (index % 19)
  const hour = 8 + (index % 12)
  const minute = index % 60
  const second = index % 60

  return `2026-09-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
}

export const transactions: Transaction[] = Array.from(
  { length: 500 },
  (_, index) => ({
    id: 10000 + index,
    cardNumber: generateCardNumber(index),
    amount: 100000 + (index % 20) * 150000,
    status: statuses[index % statuses.length],
    transactionDate: generateDate(index),
    customerName: customers[index % customers.length],
  }),
)