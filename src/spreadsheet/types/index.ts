export interface CellPosition {
  row: number
  col: number
}

export interface CellRange {
  start: CellPosition
  end: CellPosition
}

export interface CellStyle {
  fontFamily?: string
  fontSize?: number
  bold?: boolean
  italic?: boolean
  underline?: boolean
  color?: string
  backgroundColor?: string
  textAlign?: 'left' | 'center' | 'right'
  verticalAlign?: 'top' | 'middle' | 'bottom'
  border?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
  numberFormat?: 'general' | 'number' | 'currency' | 'percentage' | 'date'
  decimalPlaces?: number
}

export interface CellData {
  value: string | number | boolean | null
  formula?: string
  style?: CellStyle
  merged?: boolean
  mergeInfo?: {
    startRow: number
    startCol: number
    endRow: number
    endCol: number
  }
}

export interface CellMeta {
  width: number
  height: number
  hidden?: boolean
}

export interface SpreadsheetState {
  cells: Map<string, CellData>
  rowMetas: Map<number, CellMeta>
  colMetas: Map<number, CellMeta>
  mergedCells: CellRange[]
  selectedCell: CellPosition | null
  selectedRange: CellRange | null
  editingCell: CellPosition | null
  scrollTop: number
  scrollLeft: number
  frozenRows: number
  frozenCols: number
  undoStack: UndoRedoAction[]
  redoStack: UndoRedoAction[]
  filters: Map<number, FilterCondition>
  sortConfig: SortConfig | null
  conditionalFormats: ConditionalFormat[]
  charts: ChartConfig[]
}

export interface UndoRedoAction {
  type: string
  payload: any
  previousState: any
}

export interface FilterCondition {
  column: number
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  value: string | number
}

export interface SortConfig {
  column: number
  direction: 'asc' | 'desc'
}

export interface ConditionalFormat {
  range: CellRange
  condition: {
    type: 'cell_value' | 'color_scale'
    operator?: string
    value?: string | number
  }
  style: Partial<CellStyle>
}

export interface ChartConfig {
  id: string
  type: 'bar' | 'line' | 'pie'
  title: string
  dataRange: CellRange
  position: { x: number; y: number }
  size: { width: number; height: number }
}

export interface FormulaResult {
  value: string | number | boolean | null
  error?: string
}

export interface WorkerMessage {
  type: 'calculate' | 'batchCalculate' | 'parseFormula'
  payload: any
  id: string
}

export interface WorkerResponse {
  type: 'result' | 'error'
  payload: any
  id: string
}
