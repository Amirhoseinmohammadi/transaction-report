
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}


export function formatDate(dateString: string): string {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export function formatCardNumber(cardNumber: string): string {
  if (!cardNumber) return '—'
  if (cardNumber.length === 16 && cardNumber.includes('*')) {
    return `${cardNumber.slice(0, 4)} •••• •••• ${cardNumber.slice(12)}`
  }
  return cardNumber
}
