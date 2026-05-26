import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  CellPosition, CellRange, CellData, CellStyle, 
  CellMeta, FilterCondition, SortConfig, 
  ConditionalFormat, ChartConfig 
} from '../types'
import { 
  CELL_KEY, PARSE_CELL_KEY, IS_IN_RANGE, 
  NORMALIZE_RANGE, CLONE_CELL_DATA, CLONE_CELLS_MAP, GENERATE_ID,
  PARSE_FORMULA_DEPENDENCIES
} from '../utils/cellUtils'
import { parseFormula } from '../formula/FormulaParser'

export const useSpreadsheetStore = defineStore('spreadsheet', () => {
  const DEFAULT_ROW_HEIGHT = 32
  const DEFAULT_COL_WIDTH = 100
  const MAX_UNDO_STACK = 100

  const cells = ref<Map<string, CellData>>(new Map())
  const rowMetas = ref<Map<number, CellMeta>>(new Map())
  const colMetas = ref<Map<number, CellMeta>>(new Map())
  const mergedCells = ref<CellRange[]>([])
  const selectedCell = ref<CellPosition | null>(null)
  const selectedRange = ref<CellRange | null>(null)
  const editingCell = ref<CellPosition | null>(null)
  const scrollTop = ref(0)
  const scrollLeft = ref(0)
  const frozenRows = ref(0)
  const frozenCols = ref(0)
  const undoStack = ref<any[]>([])
  const redoStack = ref<any[]>([])
  const filters = ref<Map<number, FilterCondition>>(new Map())
  const sortConfig = ref<SortConfig | null>(null)
  const conditionalFormats = ref<ConditionalFormat[]>([])
  const charts = ref<ChartConfig[]>([])
  const isCalculating = ref(false)
  const dependencyGraph = ref<Map<string, Set<string>>>(new Map())
  const reverseDependencyGraph = ref<Map<string, Set<string>>>(new Map())
  const formulaCells = ref<Set<string>>(new Set())

  const getRowHeight = (row: number): number => {
    return rowMetas.value.get(row)?.height || DEFAULT_ROW_HEIGHT
  }

  const getColWidth = (col: number): number => {
    return colMetas.value.get(col)?.width || DEFAULT_COL_WIDTH
  }

  const setRowHeight = (row: number, height: number) => {
    rowMetas.value.set(row, { ...rowMetas.value.get(row), height })
  }

  const setColWidth = (col: number, width: number) => {
    colMetas.value.set(col, { ...colMetas.value.get(col), width })
  }

  const getCell = (row: number, col: number): CellData | undefined => {
    const mergeInfo = getMergeInfo(row, col)
    if (mergeInfo) {
      return cells.value.get(CELL_KEY(mergeInfo.startRow, mergeInfo.startCol))
    }
    return cells.value.get(CELL_KEY(row, col))
  }

  const setCell = (row: number, col: number, data: Partial<CellData>, pushUndo: boolean = true, skipRecalculate: boolean = false) => {
    const key = CELL_KEY(row, col)
    const existing = cells.value.get(key)
    
    if (pushUndo) {
      pushUndoAction({
        type: 'SET_CELL',
        payload: { row, col, data },
        previousState: { key, existing: CLONE_CELL_DATA(existing) }
      })
    }

    const newCell = {
      value: null,
      ...existing,
      ...data
    }

    if (data.formula !== undefined) {
      if (data.formula) {
        formulaCells.value.add(key)
        updateDependencies(key, data.formula)
      } else {
        formulaCells.value.delete(key)
        removeDependencies(key)
      }
    }

    cells.value.set(key, newCell)

    if (!skipRecalculate && !data.formula) {
      recalculateDependents(key)
    }
  }

  const updateDependencies = (cellKey: string, formula: string) => {
    removeDependencies(cellKey)
    
    const dependencies = PARSE_FORMULA_DEPENDENCIES(formula)
    dependencyGraph.value.set(cellKey, new Set(dependencies))
    
    for (const depKey of dependencies) {
      if (!reverseDependencyGraph.value.has(depKey)) {
        reverseDependencyGraph.value.set(depKey, new Set())
      }
      reverseDependencyGraph.value.get(depKey)!.add(cellKey)
    }
  }

  const removeDependencies = (cellKey: string) => {
    const oldDeps = dependencyGraph.value.get(cellKey)
    if (oldDeps) {
      for (const depKey of oldDeps) {
        reverseDependencyGraph.value.get(depKey)?.delete(cellKey)
      }
    }
    dependencyGraph.value.delete(cellKey)
  }

  const getDependentCells = (cellKey: string, visited: Set<string> = new Set()): string[] => {
    if (visited.has(cellKey)) return []
    visited.add(cellKey)
    
    const dependents = reverseDependencyGraph.value.get(cellKey)
    if (!dependents) return []
    
    const result: string[] = []
    for (const dep of dependents) {
      result.push(dep)
      result.push(...getDependentCells(dep, visited))
    }
    return result
  }

  const recalculateDependents = (changedKey: string) => {
    const dependents = getDependentCells(changedKey)
    const uniqueDependents = [...new Set(dependents)]
    
    for (const depKey of uniqueDependents) {
      const { row, col } = PARSE_CELL_KEY(depKey)
      const cell = cells.value.get(depKey)
      if (cell?.formula) {
        const result = parseFormula(cell.formula, row, col, cells.value)
        cells.value.set(depKey, {
          ...cell,
          value: result.error ? result.error : result.value
        })
      }
    }
  }

  const recalculateAllFormulas = () => {
    for (const cellKey of formulaCells.value) {
      const { row, col } = PARSE_CELL_KEY(cellKey)
      const cell = cells.value.get(cellKey)
      if (cell?.formula) {
        const result = parseFormula(cell.formula, row, col, cells.value)
        cells.value.set(cellKey, {
          ...cell,
          value: result.error ? result.error : result.value
        })
      }
    }
  }

  const getMergeInfo = (row: number, col: number) => {
    for (const range of mergedCells.value) {
      if (IS_IN_RANGE({ row, col }, range)) {
        return {
          startRow: range.start.row,
          startCol: range.start.col,
          endRow: range.end.row,
          endCol: range.end.col
        }
      }
    }
    return null
  }

  const mergeCells = (range: CellRange) => {
    const normalized = NORMALIZE_RANGE(range)
    pushUndoAction({
      type: 'MERGE_CELLS',
      payload: { range: normalized },
      previousState: { 
        mergedCells: [...mergedCells.value],
        cells: CLONE_CELLS_MAP(cells.value)
      }
    })

    mergedCells.value = mergedCells.value.filter(r => {
      return !(IS_IN_RANGE(normalized.start, r) || IS_IN_RANGE(normalized.end, r))
    })
    mergedCells.value.push(normalized)

    const firstCell = getCell(normalized.start.row, normalized.start.col)
    for (let r = normalized.start.row; r <= normalized.end.row; r++) {
      for (let c = normalized.start.col; c <= normalized.end.col; c++) {
        const key = CELL_KEY(r, c)
        if (r === normalized.start.row && c === normalized.start.col) {
          cells.value.set(key, {
            ...firstCell,
            merged: true,
            mergeInfo: {
              startRow: normalized.start.row,
              startCol: normalized.start.col,
              endRow: normalized.end.row,
              endCol: normalized.end.col
            }
          })
        } else {
          cells.value.delete(key)
        }
      }
    }
  }

  const unmergeCells = (range: CellRange) => {
    const normalized = NORMALIZE_RANGE(range)
    pushUndoAction({
      type: 'UNMERGE_CELLS',
      payload: { range: normalized },
      previousState: { mergedCells: [...mergedCells.value] }
    })

    mergedCells.value = mergedCells.value.filter(r => {
      return !(IS_IN_RANGE(normalized.start, r) && IS_IN_RANGE(normalized.end, r))
    })

    const cell = getCell(normalized.start.row, normalized.start.col)
    if (cell) {
      delete cell.merged
      delete cell.mergeInfo
    }
  }

  const selectCell = (row: number, col: number) => {
    selectedCell.value = { row, col }
    selectedRange.value = null
    editingCell.value = null
  }

  const selectRange = (range: CellRange) => {
    selectedRange.value = NORMALIZE_RANGE(range)
    selectedCell.value = range.start
  }

  const startEditing = (row: number, col: number) => {
    editingCell.value = { row, col }
  }

  const stopEditing = () => {
    editingCell.value = null
  }

  const applyStyle = (range: CellRange, style: Partial<CellStyle>) => {
    const normalized = NORMALIZE_RANGE(range)
    const affectedCells: { key: string; existing: CellData | undefined }[] = []
    
    pushUndoAction({
      type: 'APPLY_STYLE',
      payload: { range: normalized, style },
      previousState: { cells: CLONE_CELLS_MAP(cells.value) }
    })

    for (let r = normalized.start.row; r <= normalized.end.row; r++) {
      for (let c = normalized.start.col; c <= normalized.end.col; c++) {
        const key = CELL_KEY(r, c)
        const existing = cells.value.get(key)
        cells.value.set(key, {
          value: null,
          ...existing,
          style: { ...existing?.style, ...style }
        })
      }
    }
  }

  const clearRange = (range: CellRange) => {
    const normalized = NORMALIZE_RANGE(range)
    pushUndoAction({
      type: 'CLEAR_RANGE',
      payload: { range: normalized },
      previousState: { cells: CLONE_CELLS_MAP(cells.value) }
    })

    for (let r = normalized.start.row; r <= normalized.end.row; r++) {
      for (let c = normalized.start.col; c <= normalized.end.col; c++) {
        cells.value.delete(CELL_KEY(r, c))
      }
    }
  }

  const pushUndoAction = (action: any, skipRedoClear: boolean = false) => {
    undoStack.value.push(action)
    if (undoStack.value.length > MAX_UNDO_STACK) {
      undoStack.value.shift()
    }
    if (!skipRedoClear) {
      redoStack.value = []
    }
  }

  const undo = () => {
    const action = undoStack.value.pop()
    if (!action) return

    redoStack.value.push(action)

    switch (action.type) {
      case 'SET_CELL':
        if (action.previousState.existing) {
          cells.value.set(action.previousState.key, action.previousState.existing)
        } else {
          cells.value.delete(action.previousState.key)
        }
        break
      case 'MERGE_CELLS':
      case 'UNMERGE_CELLS':
        mergedCells.value = action.previousState.mergedCells
        if (action.previousState.cells) {
          cells.value = action.previousState.cells
        }
        break
      case 'APPLY_STYLE':
      case 'CLEAR_RANGE':
        cells.value = action.previousState.cells
        break
    }
  }

  const redo = () => {
    const action = redoStack.value.pop()
    if (!action) return

    undoStack.value.push(action)

    const savedRedoStack = [...redoStack.value]

    switch (action.type) {
      case 'SET_CELL':
        setCell(action.payload.row, action.payload.col, action.payload.data, false)
        break
      case 'MERGE_CELLS': {
        const prevUndoLength = undoStack.value.length
        mergeCells(action.payload.range)
        if (undoStack.value.length > prevUndoLength) {
          undoStack.value.pop()
        }
        break
      }
      case 'UNMERGE_CELLS': {
        const prevUndoLength = undoStack.value.length
        unmergeCells(action.payload.range)
        if (undoStack.value.length > prevUndoLength) {
          undoStack.value.pop()
        }
        break
      }
      case 'APPLY_STYLE': {
        const prevUndoLength = undoStack.value.length
        applyStyle(action.payload.range, action.payload.style)
        if (undoStack.value.length > prevUndoLength) {
          undoStack.value.pop()
        }
        break
      }
      case 'CLEAR_RANGE': {
        const prevUndoLength = undoStack.value.length
        clearRange(action.payload.range)
        if (undoStack.value.length > prevUndoLength) {
          undoStack.value.pop()
        }
        break
      }
    }

    redoStack.value = savedRedoStack
  }

  const setFilter = (filter: FilterCondition) => {
    filters.value.set(filter.column, filter)
  }

  const removeFilter = (column: number) => {
    filters.value.delete(column)
  }

  const clearFilters = () => {
    filters.value.clear()
  }

  const setSort = (config: SortConfig | null) => {
    sortConfig.value = config
  }

  const addConditionalFormat = (format: ConditionalFormat) => {
    conditionalFormats.value.push(format)
  }

  const removeConditionalFormat = (index: number) => {
    conditionalFormats.value.splice(index, 1)
  }

  const addChart = (chart: Omit<ChartConfig, 'id'>) => {
    charts.value.push({ ...chart, id: GENERATE_ID() })
  }

  const removeChart = (id: string) => {
    charts.value = charts.value.filter(c => c.id !== id)
  }

  const updateChart = (id: string, updates: Partial<ChartConfig>) => {
    const index = charts.value.findIndex(c => c.id === id)
    if (index !== -1) {
      charts.value[index] = { ...charts.value[index], ...updates }
    }
  }

  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  const getCellsInRange = (range: CellRange): Map<string, CellData> => {
    const normalized = NORMALIZE_RANGE(range)
    const result = new Map<string, CellData>()
    for (let r = normalized.start.row; r <= normalized.end.row; r++) {
      for (let c = normalized.start.col; c <= normalized.end.col; c++) {
        const cell = getCell(r, c)
        if (cell) {
          result.set(CELL_KEY(r, c), cell)
        }
      }
    }
    return result
  }

  const getUsedRange = (): CellRange | null => {
    if (cells.value.size === 0) return null
    
    let minRow = Infinity, maxRow = -1
    let minCol = Infinity, maxCol = -1
    
    for (const key of cells.value.keys()) {
      const { row, col } = PARSE_CELL_KEY(key)
      minRow = Math.min(minRow, row)
      maxRow = Math.max(maxRow, row)
      minCol = Math.min(minCol, col)
      maxCol = Math.max(maxCol, col)
    }
    
    return {
      start: { row: minRow, col: minCol },
      end: { row: maxRow, col: maxCol }
    }
  }

  return {
    cells,
    rowMetas,
    colMetas,
    mergedCells,
    selectedCell,
    selectedRange,
    editingCell,
    scrollTop,
    scrollLeft,
    frozenRows,
    frozenCols,
    undoStack,
    redoStack,
    filters,
    sortConfig,
    conditionalFormats,
    charts,
    isCalculating,
    formulaCells,
    canUndo,
    canRedo,
    getRowHeight,
    getColWidth,
    setRowHeight,
    setColWidth,
    getCell,
    setCell,
    getMergeInfo,
    mergeCells,
    unmergeCells,
    selectCell,
    selectRange,
    startEditing,
    stopEditing,
    applyStyle,
    clearRange,
    undo,
    redo,
    setFilter,
    removeFilter,
    clearFilters,
    setSort,
    addConditionalFormat,
    removeConditionalFormat,
    addChart,
    removeChart,
    updateChart,
    getCellsInRange,
    getUsedRange,
    recalculateDependents,
    recalculateAllFormulas,
    getDependentCells
  }
})
