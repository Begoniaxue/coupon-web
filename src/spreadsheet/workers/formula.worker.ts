import { parseFormula, calculateCell, recalculateAll } from '../formula/FormulaParser'
import type { CellData, WorkerMessage, WorkerResponse } from '../types'

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, payload, id } = e.data
  
  try {
    let result: any
    
    switch (type) {
      case 'calculate': {
        const { formula, row, col, cells } = payload
        const cellMap = new Map(Object.entries(cells))
        result = parseFormula(formula, row, col, cellMap)
        break
      }
      
      case 'calculateCell': {
        const { row, col, cells } = payload
        const cellMap = new Map(Object.entries(cells))
        result = calculateCell(row, col, cellMap)
        break
      }
      
      case 'batchCalculate': {
        const { cells } = payload
        const cellMap = new Map(Object.entries(cells))
        const calculated = recalculateAll(cellMap)
        result = Object.fromEntries(calculated)
        break
      }
      
      case 'parseFormula': {
        const { formula, row, col, cells } = payload
        const cellMap = new Map(Object.entries(cells))
        result = parseFormula(formula, row, col, cellMap)
        break
      }
      
      default:
        throw new Error(`Unknown message type: ${type}`)
    }
    
    const response: WorkerResponse = {
      type: 'result',
      payload: result,
      id
    }
    
    self.postMessage(response)
  } catch (error) {
    const response: WorkerResponse = {
      type: 'error',
      payload: { message: (error as Error).message },
      id
    }
    
    self.postMessage(response)
  }
}
