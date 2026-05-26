import type { CellPosition, CellRange, CellData } from '../types'

export const CELL_KEY = (row: number, col: number): string => `${row},${col}`

export const PARSE_CELL_KEY = (key: string): CellPosition => {
  const [row, col] = key.split(',').map(Number)
  return { row, col }
}

export const COL_TO_LETTER = (col: number): string => {
  let result = ''
  let n = col
  while (n >= 0) {
    result = String.fromCharCode(65 + (n % 26)) + result
    n = Math.floor(n / 26) - 1
  }
  return result
}

export const LETTER_TO_COL = (letters: string): number => {
  let col = 0
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64)
  }
  return col - 1
}

export const A1_TO_POSITION = (a1: string): CellPosition | null => {
  const match = a1.match(/^([A-Z]+)(\d+)$/i)
  if (!match) return null
  const col = LETTER_TO_COL(match[1].toUpperCase())
  const row = parseInt(match[2]) - 1
  return { row, col }
}

export const POSITION_TO_A1 = (row: number, col: number): string => {
  return `${COL_TO_LETTER(col)}${row + 1}`
}

export const IS_IN_RANGE = (pos: CellPosition, range: CellRange): boolean => {
  const minRow = Math.min(range.start.row, range.end.row)
  const maxRow = Math.max(range.start.row, range.end.row)
  const minCol = Math.min(range.start.col, range.end.col)
  const maxCol = Math.max(range.start.col, range.end.col)
  return pos.row >= minRow && pos.row <= maxRow && pos.col >= minCol && pos.col <= maxCol
}

export const NORMALIZE_RANGE = (range: CellRange): CellRange => {
  return {
    start: {
      row: Math.min(range.start.row, range.end.row),
      col: Math.min(range.start.col, range.end.col)
    },
    end: {
      row: Math.max(range.start.row, range.end.row),
      col: Math.max(range.start.col, range.end.col)
    }
  }
}

export const FORMAT_VALUE = (value: any, format?: string, decimalPlaces: number = 2): string => {
  if (value === null || value === undefined) return ''
  
  switch (format) {
    case 'currency':
      return `¥${Number(value).toFixed(decimalPlaces)}`
    case 'percentage':
      return `${(Number(value) * 100).toFixed(decimalPlaces)}%`
    case 'date':
      if (value instanceof Date) {
        return value.toLocaleDateString('zh-CN')
      }
      const num = Number(value)
      if (!isNaN(num) && num > 0) {
        const date = new Date(1899, 11, 30 + num)
        return date.toLocaleDateString('zh-CN')
      }
      return String(value)
    case 'number':
      return Number(value).toFixed(decimalPlaces)
    default:
      return String(value)
  }
}

export const CLONE_CELL_DATA = (cell: CellData | undefined): CellData | undefined => {
  if (!cell) return undefined
  return JSON.parse(JSON.stringify(cell))
}

export const CLONE_CELLS_MAP = (cells: Map<string, CellData>): Map<string, CellData> => {
  const cloned = new Map<string, CellData>()
  for (const [key, cell] of cells) {
    cloned.set(key, CLONE_CELL_DATA(cell)!)
  }
  return cloned
}

export const GENERATE_ID = (): string => {
  return Math.random().toString(36).substring(2, 11)
}

export const PARSE_FORMULA_DEPENDENCIES = (formula: string): string[] => {
  if (!formula || !formula.startsWith('=')) return []
  
  const expression = formula.slice(1).toUpperCase()
  const cellRefs = new Set<string>()
  
  const rangeRegex = /([A-Z]+\d+):([A-Z]+\d+)/g
  let match
  while ((match = rangeRegex.exec(expression)) !== null) {
    const start = A1_TO_POSITION(match[1])
    const end = A1_TO_POSITION(match[2])
    if (start && end) {
      const minRow = Math.min(start.row, end.row)
      const maxRow = Math.max(start.row, end.row)
      const minCol = Math.min(start.col, end.col)
      const maxCol = Math.max(start.col, end.col)
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          cellRefs.add(CELL_KEY(r, c))
        }
      }
    }
  }
  
  const cellRegex = /([A-Z]+\d+)(?!:)/g
  while ((match = cellRegex.exec(expression)) !== null) {
    const pos = A1_TO_POSITION(match[1])
    if (pos) {
      cellRefs.add(CELL_KEY(pos.row, pos.col))
    }
  }
  
  return Array.from(cellRefs)
}
