import type { CellData, CellStyle, CellPosition, CellRange } from '../types'
import { COL_TO_LETTER, IS_IN_RANGE, FORMAT_VALUE, CELL_KEY } from '../utils/cellUtils'

export interface RenderOptions {
  canvas: HTMLCanvasElement
  container: HTMLElement
  scrollTop: number
  scrollLeft: number
  frozenRows: number
  frozenCols: number
  rowCount: number
  colCount: number
  getRowHeight: (row: number) => number
  getColWidth: (col: number) => number
  getCell: (row: number, col: number) => CellData | undefined
  getMergeInfo: (row: number, col: number) => any
  selectedCell: CellPosition | null
  selectedRange: CellRange | null
  mergedCells: CellRange[]
}

export interface CellBounds {
  x: number
  y: number
  width: number
  height: number
  row: number
  col: number
}

const DEFAULT_STYLE: CellStyle = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 13,
  color: '#1f2937',
  backgroundColor: '#ffffff',
  textAlign: 'left',
  verticalAlign: 'middle'
}

const HEADER_STYLE = {
  backgroundColor: '#f3f4f6',
  textColor: '#374151',
  borderColor: '#d1d5db',
  selectedBackgroundColor: '#dbeafe',
  selectedTextColor: '#1d4ed8'
}

const GRID_COLOR = '#e5e7eb'
const SELECTION_COLOR = '#3b82f6'
const FILL_HANDLE_SIZE = 8

export class CanvasRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private container: HTMLElement
  private options!: RenderOptions
  private dpr: number = 1
  private rowHeaderWidth: number = 60
  private colHeaderHeight: number = 32

  constructor(canvas: HTMLCanvasElement, container: HTMLElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.container = container
    this.dpr = window.devicePixelRatio || 1
  }

  updateOptions(options: Partial<RenderOptions>) {
    this.options = { ...this.options, ...options }
  }

  render() {
    if (!this.options) return

    this.resizeCanvas()
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    const { scrollTop, scrollLeft, frozenRows, frozenCols } = this.options

    this.drawGrid(scrollTop, scrollLeft, false, false)
    
    if (frozenRows > 0) {
      this.drawGrid(0, scrollLeft, true, false)
    }
    if (frozenCols > 0) {
      this.drawGrid(scrollTop, 0, false, true)
    }
    if (frozenRows > 0 && frozenCols > 0) {
      this.drawGrid(0, 0, true, true)
    }

    this.drawSelection()
    this.drawFillHandle()
  }

  private resizeCanvas() {
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    
    this.canvas.width = width * this.dpr
    this.canvas.height = height * this.dpr
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`
    
    this.ctx.scale(this.dpr, this.dpr)
  }

  private drawGrid(
    scrollTop: number,
    scrollLeft: number,
    isFrozenRow: boolean,
    isFrozenCol: boolean
  ) {
    const { 
      rowCount, colCount, getRowHeight, getColWidth,
      frozenRows, frozenCols
    } = this.options

    const visibleRows = this.getVisibleRows(scrollTop, isFrozenRow ? frozenRows : rowCount)
    const visibleCols = this.getVisibleCols(scrollLeft, isFrozenCol ? frozenCols : colCount)

    this.drawRowHeaders(visibleRows, scrollTop, scrollLeft, isFrozenCol)
    this.drawColHeaders(visibleCols, scrollTop, scrollLeft, isFrozenRow)
    this.drawCells(visibleRows, visibleCols, scrollTop, scrollLeft)
  }

  private getVisibleRows(scrollTop: number, maxRows: number): number[] {
    const { getRowHeight } = this.options
    const visible: number[] = []
    let y = 0

    for (let row = 0; row < maxRows; row++) {
      const height = getRowHeight(row)
      if (y + height > scrollTop && y < scrollTop + this.container.clientHeight) {
        visible.push(row)
      }
      y += height
      if (y > scrollTop + this.container.clientHeight) break
    }

    return visible
  }

  private getVisibleCols(scrollLeft: number, maxCols: number): number[] {
    const { getColWidth } = this.options
    const visible: number[] = []
    let x = 0

    for (let col = 0; col < maxCols; col++) {
      const width = getColWidth(col)
      if (x + width > scrollLeft && x < scrollLeft + this.container.clientWidth) {
        visible.push(col)
      }
      x += width
      if (x > scrollLeft + this.container.clientWidth) break
    }

    return visible
  }

  private getRowY(row: number, scrollTop: number): number {
    const { getRowHeight } = this.options
    let y = this.colHeaderHeight
    for (let r = 0; r < row; r++) {
      y += getRowHeight(r)
    }
    return y - scrollTop
  }

  private getColX(col: number, scrollLeft: number): number {
    const { getColWidth } = this.options
    let x = this.rowHeaderWidth
    for (let c = 0; c < col; c++) {
      x += getColWidth(c)
    }
    return x - scrollLeft
  }

  private drawRowHeaders(rows: number[], scrollTop: number, scrollLeft: number, isFrozenCol: boolean) {
    const { getRowHeight, selectedCell, selectedRange } = this.options
    const ctx = this.ctx

    for (const row of rows) {
      const y = this.getRowY(row, scrollTop)
      const height = getRowHeight(row)
      
      const isSelected = selectedCell?.row === row || 
        (selectedRange && selectedRange.start.row <= row && selectedRange.end.row >= row)

      ctx.fillStyle = isSelected ? HEADER_STYLE.selectedBackgroundColor : HEADER_STYLE.backgroundColor
      ctx.fillRect(0, y, this.rowHeaderWidth, height)

      ctx.strokeStyle = HEADER_STYLE.borderColor
      ctx.lineWidth = 1
      ctx.strokeRect(0.5, y + 0.5, this.rowHeaderWidth - 1, height - 1)

      ctx.fillStyle = isSelected ? HEADER_STYLE.selectedTextColor : HEADER_STYLE.textColor
      ctx.font = '12px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(row + 1), this.rowHeaderWidth / 2, y + height / 2)
    }
  }

  private drawColHeaders(cols: number[], scrollTop: number, scrollLeft: number, isFrozenRow: boolean) {
    const { getColWidth, selectedCell, selectedRange } = this.options
    const ctx = this.ctx

    for (const col of cols) {
      const x = this.getColX(col, scrollLeft)
      const width = getColWidth(col)
      
      const isSelected = selectedCell?.col === col ||
        (selectedRange && selectedRange.start.col <= col && selectedRange.end.col >= col)

      ctx.fillStyle = isSelected ? HEADER_STYLE.selectedBackgroundColor : HEADER_STYLE.backgroundColor
      ctx.fillRect(x, 0, width, this.colHeaderHeight)

      ctx.strokeStyle = HEADER_STYLE.borderColor
      ctx.lineWidth = 1
      ctx.strokeRect(x + 0.5, 0.5, width - 1, this.colHeaderHeight - 1)

      ctx.fillStyle = isSelected ? HEADER_STYLE.selectedTextColor : HEADER_STYLE.textColor
      ctx.font = '12px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(COL_TO_LETTER(col), x + width / 2, this.colHeaderHeight / 2)
    }
  }

  private drawCells(rows: number[], cols: number[], scrollTop: number, scrollLeft: number) {
    const ctx = this.ctx
    const { getRowHeight, getColWidth, getCell, getMergeInfo } = this.options

    const drawnMerges = new Set<string>()

    for (const row of rows) {
      for (const col of cols) {
        const mergeInfo = getMergeInfo(row, col)
        
        if (mergeInfo) {
          const mergeKey = `${mergeInfo.startRow},${mergeInfo.startCol}`
          if (drawnMerges.has(mergeKey)) continue
          
          if (mergeInfo.startRow !== row || mergeInfo.startCol !== col) continue
          
          drawnMerges.add(mergeKey)
          this.drawMergedCell(mergeInfo, scrollTop, scrollLeft)
          continue
        }

        const x = this.getColX(col, scrollLeft)
        const y = this.getRowY(row, scrollTop)
        const width = getColWidth(col)
        const height = getRowHeight(row)
        const cell = getCell(row, col)

        this.drawCell(x, y, width, height, cell)
      }
    }
  }

  private drawMergedCell(mergeInfo: any, scrollTop: number, scrollLeft: number) {
    const { getRowHeight, getColWidth, getCell } = this.options
    const { startRow, startCol, endRow, endCol } = mergeInfo

    const x = this.getColX(startCol, scrollLeft)
    const y = this.getRowY(startRow, scrollTop)
    
    let width = 0
    for (let c = startCol; c <= endCol; c++) {
      width += getColWidth(c)
    }
    
    let height = 0
    for (let r = startRow; r <= endRow; r++) {
      height += getRowHeight(r)
    }

    const cell = getCell(startRow, startCol)
    this.drawCell(x, y, width, height, cell)
  }

  private drawCell(x: number, y: number, width: number, height: number, cell: CellData | undefined) {
    const ctx = this.ctx
    const style = { ...DEFAULT_STYLE, ...cell?.style }

    ctx.fillStyle = style.backgroundColor || '#ffffff'
    ctx.fillRect(x, y, width, height)

    ctx.strokeStyle = GRID_COLOR
    ctx.lineWidth = 1
    ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1)

    if (cell?.value !== null && cell?.value !== undefined) {
      ctx.fillStyle = style.color || '#1f2937'
      ctx.font = this.getFontString(style)
      ctx.textBaseline = style.verticalAlign || 'middle'

      let textX: number
      switch (style.textAlign) {
        case 'right':
          ctx.textAlign = 'right'
          textX = x + width - 8
          break
        case 'center':
          ctx.textAlign = 'center'
          textX = x + width / 2
          break
        default:
          ctx.textAlign = 'left'
          textX = x + 8
      }

      let textY: number
      switch (style.verticalAlign) {
        case 'top':
          textY = y + 8
          break
        case 'bottom':
          textY = y + height - 8
          break
        default:
          textY = y + height / 2
      }

      const displayValue = FORMAT_VALUE(cell.value, style.numberFormat, style.decimalPlaces)
      const truncated = this.truncateText(displayValue, width - 16)
      ctx.fillText(truncated, textX, textY)
    }
  }

  private getFontString(style: CellStyle): string {
    const parts: string[] = []
    if (style.bold) parts.push('bold')
    if (style.italic) parts.push('italic')
    parts.push(`${style.fontSize || 13}px`)
    parts.push(style.fontFamily || 'system-ui, sans-serif')
    return parts.join(' ')
  }

  private truncateText(text: string, maxWidth: number): string {
    const ctx = this.ctx
    if (ctx.measureText(text).width <= maxWidth) return text

    let truncated = text
    while (truncated.length > 0 && ctx.measureText(truncated + '…').width > maxWidth) {
      truncated = truncated.slice(0, -1)
    }
    return truncated + '…'
  }

  private drawSelection() {
    const { selectedCell, selectedRange, scrollTop, scrollLeft, getRowHeight, getColWidth } = this.options
    const ctx = this.ctx

    if (selectedRange) {
      const { start, end } = selectedRange
      const x = this.getColX(Math.min(start.col, end.col), scrollLeft)
      const y = this.getRowY(Math.min(start.row, end.row), scrollTop)
      
      let width = 0
      for (let c = Math.min(start.col, end.col); c <= Math.max(start.col, end.col); c++) {
        width += getColWidth(c)
      }
      
      let height = 0
      for (let r = Math.min(start.row, end.row); r <= Math.max(start.row, end.row); r++) {
        height += getRowHeight(r)
      }

      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
      ctx.fillRect(x, y, width, height)

      ctx.strokeStyle = SELECTION_COLOR
      ctx.lineWidth = 2
      ctx.strokeRect(x + 1, y + 1, width - 2, height - 2)
    } else if (selectedCell) {
      const x = this.getColX(selectedCell.col, scrollLeft)
      const y = this.getRowY(selectedCell.row, scrollTop)
      const width = getColWidth(selectedCell.col)
      const height = getRowHeight(selectedCell.row)

      ctx.strokeStyle = SELECTION_COLOR
      ctx.lineWidth = 2
      ctx.strokeRect(x + 1, y + 1, width - 2, height - 2)
    }
  }

  private drawFillHandle() {
    const { selectedCell, scrollTop, scrollLeft, getRowHeight, getColWidth } = this.options
    if (!selectedCell) return

    const ctx = this.ctx
    const x = this.getColX(selectedCell.col, scrollLeft)
    const y = this.getRowY(selectedCell.row, scrollTop)
    const width = getColWidth(selectedCell.col)
    const height = getRowHeight(selectedCell.row)

    ctx.fillStyle = SELECTION_COLOR
    ctx.fillRect(
      x + width - FILL_HANDLE_SIZE / 2,
      y + height - FILL_HANDLE_SIZE / 2,
      FILL_HANDLE_SIZE,
      FILL_HANDLE_SIZE
    )
  }

  getCellAtPosition(clientX: number, clientY: number): CellPosition | null {
    const rect = this.canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    if (x < this.rowHeaderWidth || y < this.colHeaderHeight) return null

    const { scrollTop, scrollLeft, getRowHeight, getColWidth, rowCount, colCount } = this.options

    let currentY = this.colHeaderHeight
    for (let row = 0; row < rowCount; row++) {
      const rowHeight = getRowHeight(row)
      if (y >= currentY - scrollTop && y < currentY + rowHeight - scrollTop) {
        let currentX = this.rowHeaderWidth
        for (let col = 0; col < colCount; col++) {
          const colWidth = getColWidth(col)
          if (x >= currentX - scrollLeft && x < currentX + colWidth - scrollLeft) {
            return { row, col }
          }
          currentX += colWidth
        }
        break
      }
      currentY += rowHeight
    }

    return null
  }

  isOverFillHandle(clientX: number, clientY: number): boolean {
    const { selectedCell, scrollTop, scrollLeft, getRowHeight, getColWidth } = this.options
    if (!selectedCell) return false

    const rect = this.canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    const cellX = this.getColX(selectedCell.col, scrollLeft)
    const cellY = this.getRowY(selectedCell.row, scrollTop)
    const width = getColWidth(selectedCell.col)
    const height = getRowHeight(selectedCell.row)

    return (
      x >= cellX + width - FILL_HANDLE_SIZE &&
      x <= cellX + width + FILL_HANDLE_SIZE &&
      y >= cellY + height - FILL_HANDLE_SIZE &&
      y <= cellY + height + FILL_HANDLE_SIZE
    )
  }

  getCellBounds(row: number, col: number, scrollTop: number, scrollLeft: number): CellBounds {
    return {
      x: this.getColX(col, scrollLeft),
      y: this.getRowY(row, scrollTop),
      width: this.options.getColWidth(col),
      height: this.options.getRowHeight(row),
      row,
      col
    }
  }
}
