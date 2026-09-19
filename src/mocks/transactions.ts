import type { Transaction } from '@/types/transaction'

export const transactions: Transaction[] = [
  {
    id: 1,
    cardNumber: '6037********1234',
    amount: 1250000,
    status: 'Successful',
    transactionDate: '2026-09-18T10:30:00',
    customerName: 'Ali Ahmadi',
  },
  {
    id: 2,
    cardNumber: '5892********5678',
    amount: 850000,
    status: 'Pending',
    transactionDate: '2026-09-18T11:15:00',
    customerName: 'Sara Mohammadi',
  },
  {
    id: 3,
    cardNumber: '6274********9012',
    amount: 2300000,
    status: 'Failed',
    transactionDate: '2026-09-18T12:45:00',
    customerName: 'Reza Karimi',
  },
  {
    id: 4,
    cardNumber: '6037********3456',
    amount: 450000,
    status: 'Successful',
    transactionDate: '2026-09-18T14:20:00',
    customerName: 'Maryam Ahmadi',
  },
  {
    id: 5,
    cardNumber: '5892********7890',
    amount: 1750000,
    status: 'Successful',
    transactionDate: '2026-09-19T09:10:00',
    customerName: 'Mohammad Rezaei',
  },
]