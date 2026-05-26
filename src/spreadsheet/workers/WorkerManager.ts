import type { WorkerMessage, WorkerResponse } from '../types'

class WorkerManager {
  private worker: Worker | null = null
  private pendingRequests: Map<string, (response: WorkerResponse) => void> = new Map()

  constructor() {
    this.initWorker()
  }

  private initWorker() {
    try {
      this.worker = new Worker(
        new URL('./formula.worker.ts', import.meta.url),
        { type: 'module' }
      )
      
      this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const { id, type, payload } = e.data
        const resolver = this.pendingRequests.get(id)
        if (resolver) {
          resolver({ id, type, payload })
          this.pendingRequests.delete(id)
        }
      }
      
      this.worker.onerror = (error) => {
        console.error('Worker error:', error)
        this.rejectAll(error.message)
      }
    } catch (e) {
      console.warn('WebWorker not supported, falling back to main thread')
      this.worker = null
    }
  }

  private rejectAll(message: string) {
    for (const [id, resolver] of this.pendingRequests) {
      resolver({ id, type: 'error', payload: { message } })
    }
    this.pendingRequests.clear()
  }

  async sendMessage(type: string, payload: any): Promise<any> {
    const id = Math.random().toString(36).substring(2, 15)
    
    if (!this.worker) {
      return this.fallbackCalculate(type, payload)
    }
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, (response) => {
        if (response.type === 'error') {
          reject(new Error(response.payload?.message || 'Worker error'))
        } else {
          resolve(response.payload)
        }
      })
      
      const message: WorkerMessage = { type, payload, id }
      this.worker!.postMessage(message)
      
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id)
          reject(new Error('Worker timeout'))
        }
      }, 30000)
    })
  }

  private async fallbackCalculate(type: string, payload: any): Promise<any> {
    const { parseFormula, calculateCell, recalculateAll } = await import('../formula/FormulaParser')
    
    switch (type) {
      case 'calculate': {
        const { formula, row, col, cells } = payload
        const cellMap = new Map(Object.entries(cells))
        return parseFormula(formula, row, col, cellMap)
      }
      case 'calculateCell': {
        const { row, col, cells } = payload
        const cellMap = new Map(Object.entries(cells))
        return calculateCell(row, col, cellMap)
      }
      case 'batchCalculate': {
        const { cells } = payload
        const cellMap = new Map(Object.entries(cells))
        const calculated = recalculateAll(cellMap)
        return Object.fromEntries(calculated)
      }
      default:
        throw new Error(`Unknown calculation type: ${type}`)
    }
  }

  async calculate(formula: string, row: number, col: number, cells: Map<string, any>): Promise<any> {
    const cellsObj = Object.fromEntries(cells)
    return this.sendMessage('calculate', { formula, row, col, cells: cellsObj })
  }

  async calculateCell(row: number, col: number, cells: Map<string, any>): Promise<any> {
    const cellsObj = Object.fromEntries(cells)
    return this.sendMessage('calculateCell', { row, col, cells: cellsObj })
  }

  async batchCalculate(cells: Map<string, any>): Promise<any> {
    const cellsObj = Object.fromEntries(cells)
    return this.sendMessage('batchCalculate', { cells: cellsObj })
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.rejectAll('Worker terminated')
  }
}

export const workerManager = new WorkerManager()
