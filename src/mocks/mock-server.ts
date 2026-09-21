import type { Plugin, ViteDevServer, PreviewServer } from 'vite'
import { transactions } from './transactions.ts'

export function mockApiPlugin(): Plugin {
  const handler = (
    req: InstanceType<typeof import('http').IncomingMessage>,
    res: InstanceType<typeof import('http').ServerResponse>,
  ) => {
    if (req.method !== 'GET') {
      res.statusCode = 405
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Method Not Allowed' }))
      return
    }

    const url = new URL(req.url ?? '', 'http://localhost')
    const searchParams = url.searchParams

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10) || 10)
    const search = searchParams.get('search')?.trim() || ''
    const status = searchParams.get('status')?.trim() || ''
    const fromDate = searchParams.get('fromDate')?.trim() || ''
    const toDate = searchParams.get('toDate')?.trim() || ''
    const mockError = searchParams.get('mockError')

    const minMs = 200
    const maxMs = 800
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs

    let isAborted = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const cleanup = () => {
      isAborted = true
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    }

    req.once('close', cleanup)
    req.once('aborted', cleanup)

    timer = setTimeout(() => {
      req.off('close', cleanup)
      req.off('aborted', cleanup)

      if (isAborted || req.destroyed || res.writableEnded) {
        return
      }

      if (mockError === 'true' || mockError === '1') {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(
          JSON.stringify({
            error: 'Internal Server Error (Simulated)',
          }),
        )
        return
      }

      let result = [...transactions]

      if (search) {
        const query = search.toLowerCase()
        result = result.filter(
          (t) =>
            t.customerName.toLowerCase().includes(query) ||
            t.cardNumber.toLowerCase().includes(query),
        )
      }

      if (status) {
        result = result.filter((t) => t.status === status)
      }

      if (fromDate) {
        const from = new Date(fromDate)
        from.setHours(0, 0, 0, 0)
        result = result.filter((t) => new Date(t.transactionDate) >= from)
      }

      if (toDate) {
        const to = new Date(toDate)
        to.setHours(23, 59, 59, 999)
        result = result.filter((t) => new Date(t.transactionDate) <= to)
      }

      const totalCount = result.length
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const data = result.slice(start, end)

      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          data,
          totalCount,
        }),
      )
    }, delay)
  }

  return {
    name: 'mock-transactions-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/transactions', handler)
    },
    configurePreviewServer(server: PreviewServer) {
      server.middlewares.use('/api/transactions', handler)
    },
  }
}
