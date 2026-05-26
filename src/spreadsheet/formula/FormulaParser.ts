import { A1_TO_POSITION, CELL_KEY } from '../utils/cellUtils'
import type { CellData, FormulaResult, CellRange } from '../types'

const FUNCTIONS: Record<string, (args: any[], cells: Map<string, CellData>) => any> = {
  SUM: (args, cells) => {
    let sum = 0
    for (const arg of args) {
      sum += getNumericValue(arg, cells)
    }
    return sum
  },

  AVG: (args, cells) => {
    let sum = 0
    let count = 0
    for (const arg of args) {
      const values = getRangeValues(arg, cells)
      for (const v of values) {
        if (v !== null && v !== undefined && !isNaN(Number(v))) {
          sum += Number(v)
          count++
        }
      }
    }
    return count > 0 ? sum / count : 0
  },

  COUNT: (args, cells) => {
    let count = 0
    for (const arg of args) {
      const values = getRangeValues(arg, cells)
      for (const v of values) {
        if (v !== null && v !== undefined && !isNaN(Number(v))) {
          count++
        }
      }
    }
    return count
  },

  MAX: (args, cells) => {
    let max = -Infinity
    for (const arg of args) {
      const values = getRangeValues(arg, cells)
      for (const v of values) {
        const num = Number(v)
        if (!isNaN(num) && num > max) max = num
      }
    }
    return max === -Infinity ? 0 : max
  },

  MIN: (args, cells) => {
    let min = Infinity
    for (const arg of args) {
      const values = getRangeValues(arg, cells)
      for (const v of values) {
        const num = Number(v)
        if (!isNaN(num) && num < min) min = num
      }
    }
    return min === Infinity ? 0 : min
  },

  IF: (args, cells) => {
    if (args.length < 2) return '#ERROR'
    const condition = evaluateCondition(args[0], cells)
    if (condition) {
      return getValue(args[1], cells)
    }
    return args.length > 2 ? getValue(args[2], cells) : false
  },

  VLOOKUP: (args, cells) => {
    if (args.length < 4) return '#ERROR'
    const lookupValue = getValue(args[0], cells)
    const tableRange = parseRange(args[1])
    const colIndex = Math.floor(getNumericValue(args[2], cells))
    const rangeLookup = args.length > 3 ? getNumericValue(args[3], cells) : 1

    if (!tableRange) return '#REF!'

    const values: any[][] = []
    for (let r = tableRange.start.row; r <= tableRange.end.row; r++) {
      const rowValues: any[] = []
      for (let c = tableRange.start.col; c <= tableRange.end.col; c++) {
        const cell = cells.get(CELL_KEY(r, c))
        rowValues.push(cell?.value ?? null)
      }
      values.push(rowValues)
    }

    for (let i = 0; i < values.length; i++) {
      const cellValue = values[i][0]
      if (rangeLookup) {
        if (String(cellValue) <= String(lookupValue) && 
            (i === values.length - 1 || String(values[i + 1][0]) > String(lookupValue))) {
          return values[i][colIndex - 1] ?? null
        }
      } else {
        if (String(cellValue) === String(lookupValue)) {
          return values[i][colIndex - 1] ?? null
        }
      }
    }
    return '#N/A'
  },

  CONCAT: (args, cells) => {
    return args.map(arg => getValue(arg, cells)).join('')
  },

  LEN: (args, cells) => {
    const value = String(getValue(args[0], cells))
    return value.length
  },

  ROUND: (args, cells) => {
    const value = getNumericValue(args[0], cells)
    const decimals = args.length > 1 ? Math.floor(getNumericValue(args[1], cells)) : 0
    const factor = Math.pow(10, decimals)
    return Math.round(value * factor) / factor
  },

  ABS: (args, cells) => {
    return Math.abs(getNumericValue(args[0], cells))
  },

  TODAY: () => {
    const now = new Date()
    const start = new Date(1899, 11, 30)
    const diff = now.getTime() - start.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  },

  NOW: () => {
    const now = new Date()
    const start = new Date(1899, 11, 30)
    const diff = now.getTime() - start.getTime()
    return diff / (1000 * 60 * 60 * 24)
  }
}

function getValue(arg: any, cells: Map<string, CellData>): any {
  if (typeof arg === 'string' && /^[A-Z]+\d+$/i.test(arg)) {
    const pos = A1_TO_POSITION(arg)
    if (pos) {
      const cell = cells.get(CELL_KEY(pos.row, pos.col))
      return cell?.value ?? null
    }
  }
  if (typeof arg === 'string' && arg.startsWith('"') && arg.endsWith('"')) {
    return arg.slice(1, -1)
  }
  return arg
}

function getNumericValue(arg: any, cells: Map<string, CellData>): number {
  const value = getValue(arg, cells)
  const num = Number(value)
  return isNaN(num) ? 0 : num
}

function getRangeValues(arg: any, cells: Map<string, CellData>): any[] {
  if (typeof arg === 'string' && arg.includes(':')) {
    const range = parseRange(arg)
    if (!range) return []
    
    const values: any[] = []
    for (let r = range.start.row; r <= range.end.row; r++) {
      for (let c = range.start.col; c <= range.end.col; c++) {
        const cell = cells.get(CELL_KEY(r, c))
        values.push(cell?.value ?? null)
      }
    }
    return values
  }
  return [getValue(arg, cells)]
}

function parseRange(rangeStr: string): CellRange | null {
  const parts = rangeStr.split(':')
  if (parts.length !== 2) return null
  
  const start = A1_TO_POSITION(parts[0].trim())
  const end = A1_TO_POSITION(parts[1].trim())
  
  if (!start || !end) return null
  
  return {
    start: {
      row: Math.min(start.row, end.row),
      col: Math.min(start.col, end.col)
    },
    end: {
      row: Math.max(start.row, end.row),
      col: Math.max(start.col, end.col)
    }
  }
}

function evaluateCondition(expr: string, cells: Map<string, CellData>): boolean {
  const operators = ['>=', '<=', '<>', '>', '<', '=']
  for (const op of operators) {
    if (expr.includes(op)) {
      const [left, right] = expr.split(op).map(s => s.trim())
      const leftVal = getValue(left, cells)
      const rightVal = getValue(right, cells)
      
      switch (op) {
        case '=': return String(leftVal) === String(rightVal)
        case '<>': return String(leftVal) !== String(rightVal)
        case '>': return Number(leftVal) > Number(rightVal)
        case '<': return Number(leftVal) < Number(rightVal)
        case '>=': return Number(leftVal) >= Number(rightVal)
        case '<=': return Number(leftVal) <= Number(rightVal)
      }
    }
  }
  return Boolean(getValue(expr, cells))
}

function tokenize(formula: string): string[] {
  const tokens: string[] = []
  let i = 0
  
  while (i < formula.length) {
    const char = formula[i]
    
    if (/\s/.test(char)) {
      i++
      continue
    }
    
    if (char === '"') {
      let str = '"'
      i++
      while (i < formula.length && formula[i] !== '"') {
        str += formula[i]
        i++
      }
      str += '"'
      tokens.push(str)
      i++
      continue
    }
    
    if (/[A-Za-z]/.test(char)) {
      let word = ''
      while (i < formula.length && /[A-Za-z0-9_]/.test(formula[i])) {
        word += formula[i]
        i++
      }
      if (/^[A-Z]+\d+$/i.test(word)) {
        tokens.push(word.toUpperCase())
      } else {
        tokens.push(word.toUpperCase())
      }
      continue
    }
    
    if (/[0-9.]/.test(char)) {
      let num = ''
      while (i < formula.length && /[0-9.]/.test(formula[i])) {
        num += formula[i]
        i++
      }
      tokens.push(num)
      continue
    }
    
    if (['(', ')', ',', '+', '-', '*', '/', ':', '>', '<', '=', '!'].includes(char)) {
      if ((char === '<' || char === '>' || char === '!') && formula[i + 1] === '=') {
        tokens.push(char + '=')
        i += 2
      } else if (char === '<' && formula[i + 1] === '>') {
        tokens.push('<>')
        i += 2
      } else {
        tokens.push(char)
        i++
      }
      continue
    }
    
    i++
  }
  
  return tokens
}

function parseExpression(tokens: string[], pos: { value: number }, cells: Map<string, CellData>): any {
  let result = parseTerm(tokens, pos, cells)
  
  while (pos.value < tokens.length && (tokens[pos.value] === '+' || tokens[pos.value] === '-')) {
    const op = tokens[pos.value]
    pos.value++
    const right = parseTerm(tokens, pos, cells)
    
    if (op === '+') {
      result = Number(result) + Number(right)
    } else {
      result = Number(result) - Number(right)
    }
  }
  
  return result
}

function parseTerm(tokens: string[], pos: { value: number }, cells: Map<string, CellData>): any {
  let result = parseFactor(tokens, pos, cells)
  
  while (pos.value < tokens.length && (tokens[pos.value] === '*' || tokens[pos.value] === '/')) {
    const op = tokens[pos.value]
    pos.value++
    const right = parseFactor(tokens, pos, cells)
    
    if (op === '*') {
      result = Number(result) * Number(right)
    } else {
      result = Number(result) / Number(right)
    }
  }
  
  return result
}

function parseFactor(tokens: string[], pos: { value: number }, cells: Map<string, CellData>): any {
  let token = tokens[pos.value]
  
  if (token === '-' && pos.value + 1 < tokens.length) {
    pos.value++
    return -Number(parseFactor(tokens, pos, cells))
  }
  
  if (token === '(') {
    pos.value++
    const result = parseExpression(tokens, pos, cells)
    if (tokens[pos.value] === ')') {
      pos.value++
    }
    return result
  }
  
  if (/^[A-Z_][A-Z0-9_]*$/.test(token) && tokens[pos.value + 1] === '(') {
    return parseFunction(tokens, pos, cells)
  }
  
  if (/^[A-Z]+\d+:[A-Z]+\d+$/i.test(token)) {
    pos.value++
    return token
  }
  
  if (/^[A-Z]+\d+$/i.test(token)) {
    pos.value++
    const posInfo = A1_TO_POSITION(token)
    if (posInfo) {
      const cell = cells.get(CELL_KEY(posInfo.row, posInfo.col))
      return cell?.value ?? null
    }
    return null
  }
  
  if (token.startsWith('"') && token.endsWith('"')) {
    pos.value++
    return token.slice(1, -1)
  }
  
  if (!isNaN(Number(token))) {
    pos.value++
    return Number(token)
  }
  
  pos.value++
  return token
}

function parseFunction(tokens: string[], pos: { value: number }, cells: Map<string, CellData>): any {
  const funcName = tokens[pos.value]
  pos.value += 2
  
  const args: any[] = []
  
  while (pos.value < tokens.length && tokens[pos.value] !== ')') {
    args.push(parseExpression(tokens, pos, cells))
    if (tokens[pos.value] === ',') {
      pos.value++
    }
  }
  
  if (tokens[pos.value] === ')') {
    pos.value++
  }
  
  const func = FUNCTIONS[funcName]
  if (func) {
    try {
      return func(args, cells)
    } catch (e) {
      return '#ERROR'
    }
  }
  
  return '#NAME?'
}

function detectCycle(
  row: number,
  col: number,
  cells: Map<string, CellData>,
  visited: Set<string> = new Set()
): boolean {
  const key = CELL_KEY(row, col)
  if (visited.has(key)) return true
  
  const cell = cells.get(key)
  if (!cell?.formula) return false
  
  visited.add(key)
  
  const cellRefs = cell.formula.match(/[A-Z]+\d+/gi) || []
  for (const ref of cellRefs) {
    const pos = A1_TO_POSITION(ref)
    if (pos) {
      if (detectCycle(pos.row, pos.col, cells, new Set(visited))) {
        return true
      }
    }
  }
  
  return false
}

export function parseFormula(
  formula: string,
  row: number,
  col: number,
  cells: Map<string, CellData>
): FormulaResult {
  if (!formula.startsWith('=')) {
    return { value: formula }
  }
  
  try {
    if (detectCycle(row, col, cells)) {
      return { value: null, error: '#CIRCLE!' }
    }
    
    const expression = formula.slice(1)
    const tokens = tokenize(expression)
    const pos = { value: 0 }
    const result = parseExpression(tokens, pos, cells)
    
    if (typeof result === 'string' && result.startsWith('#')) {
      return { value: null, error: result }
    }
    
    return { value: result }
  } catch (e) {
    return { value: null, error: '#ERROR!' }
  }
}

export function calculateCell(
  row: number,
  col: number,
  cells: Map<string, CellData>,
  visited: Set<string> = new Set()
): FormulaResult {
  const key = CELL_KEY(row, col)
  const cell = cells.get(key)
  
  if (!cell) {
    return { value: null }
  }
  
  if (!cell.formula) {
    return { value: cell.value }
  }
  
  return parseFormula(cell.formula, row, col, cells)
}

export function recalculateAll(cells: Map<string, CellData>): Map<string, CellData> {
  const result = new Map(cells)
  
  for (const [key, cell] of result) {
    if (cell.formula) {
      const [row, col] = key.split(',').map(Number)
      const calcResult = calculateCell(row, col, result)
      result.set(key, { ...cell, value: calcResult.value })
    }
  }
  
  return result
}
