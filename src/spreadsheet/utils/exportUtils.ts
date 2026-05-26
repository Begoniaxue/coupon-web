import * as XLSX from 'xlsx'
import type { CellData, CellRange } from '../types'
import { CELL_KEY, PARSE_CELL_KEY, FORMAT_VALUE } from './cellUtils'

export interface ExportOptions {
  filename?: string
  includeHeaders?: boolean
}

export function exportToCSV(
  cells: Map<string, CellData>,
  usedRange: CellRange | null,
  options: ExportOptions = {}
): void {
  if (!usedRange) {
    alert('没有数据可导出')
    return
  }

  const { filename = 'spreadsheet.csv', includeHeaders = true } = options
  const { start, end } = usedRange

  const rows: string[][] = []

  for (let r = start.row; r <= end.row; r++) {
    const rowData: string[] = []
    for (let c = start.col; c <= end.col; c++) {
      const cell = cells.get(CELL_KEY(r, c))
      let value = ''
      if (cell) {
        const displayValue = FORMAT_VALUE(
          cell.value,
          cell.style?.numberFormat,
          cell.style?.decimalPlaces
        )
        value = String(displayValue).replace(/"/g, '""')
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
          value = `"${value}"`
        }
      }
      rowData.push(value)
    }
    rows.push(rowData)
  }

  const csvContent = rows.map(row => row.join(',')).join('\n')
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })
  downloadBlob(blob, filename)
}

export function exportToExcel(
  cells: Map<string, CellData>,
  usedRange: CellRange | null,
  options: ExportOptions = {}
): void {
  if (!usedRange) {
    alert('没有数据可导出')
    return
  }

  const { filename = 'spreadsheet.xlsx' } = options
  const { start, end } = usedRange

  const data: any[][] = []

  for (let r = start.row; r <= end.row; r++) {
    const rowData: any[] = []
    for (let c = start.col; c <= end.col; c++) {
      const cell = cells.get(CELL_KEY(r, c))
      rowData.push(cell?.value ?? '')
    }
    data.push(rowData)
  }

  const ws = XLSX.utils.aoa_to_sheet(data)

  for (const [key, cell] of cells) {
    const { row, col } = PARSE_CELL_KEY(key)
    const cellAddr = XLSX.utils.encode_cell({ r: row - start.row, c: col - start.col })
    
    if (cell.style) {
      ws[cellAddr] = ws[cellAddr] || { v: cell.value }
      ws[cellAddr].s = {}
      
      if (cell.style.fontFamily || cell.style.fontSize || cell.style.bold || cell.style.italic) {
        ws[cellAddr].s.font = {}
        if (cell.style.fontFamily) ws[cellAddr].s.font.name = cell.style.fontFamily
        if (cell.style.fontSize) ws[cellAddr].s.font.sz = cell.style.fontSize
        if (cell.style.bold) ws[cellAddr].s.font.bold = true
        if (cell.style.italic) ws[cellAddr].s.font.italic = true
        if (cell.style.underline) ws[cellAddr].s.font.underline = true
        if (cell.style.color) {
          ws[cellAddr].s.font.color = { rgb: cell.style.color.replace('#', '') }
        }
      }
      
      if (cell.style.backgroundColor) {
        ws[cellAddr].s.fill = {
          fgColor: { rgb: cell.style.backgroundColor.replace('#', '') }
        }
      }
      
      if (cell.style.textAlign || cell.style.verticalAlign) {
        ws[cellAddr].s.alignment = {}
        if (cell.style.textAlign) ws[cellAddr].s.alignment.horizontal = cell.style.textAlign
        if (cell.style.verticalAlign) ws[cellAddr].s.alignment.vertical = cell.style.verticalAlign
      }
    }
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, filename)
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function copyToClipboard(
  cells: Map<string, CellData>,
  range: CellRange
): Promise<boolean> {
  const { start, end } = range
  const rows: string[][] = []

  for (let r = start.row; r <= end.row; r++) {
    const rowData: string[] = []
    for (let c = start.col; c <= end.col; c++) {
      const cell = cells.get(CELL_KEY(r, c))
      rowData.push(cell?.value?.toString() ?? '')
    }
    rows.push(rowData)
  }

  const text = rows.map(row => row.join('\t')).join('\n')
  
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (e) {
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textarea)
    return success
  }
}

export async function pasteFromClipboard(): Promise<string[][] | null> {
  try {
    const text = await navigator.clipboard.readText()
    if (!text) return null
    
    const rows = text.split('\n').map(row => row.split('\t'))
    return rows.filter(row => row.some(cell => cell.trim() !== ''))
  } catch (e) {
    return null
  }
}
