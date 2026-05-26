<template>
  <div class="spreadsheet-container" ref="containerRef">
    <Toolbar
      :canUndo="store.canUndo"
      :canRedo="store.canRedo"
      :fontFamily="currentStyle.fontFamily || 'system-ui, -apple-system, sans-serif'"
      :fontSize="currentStyle.fontSize || 13"
      :bold="!!currentStyle.bold"
      :italic="!!currentStyle.italic"
      :underline="!!currentStyle.underline"
      :color="currentStyle.color || '#1f2937'"
      :backgroundColor="currentStyle.backgroundColor || '#ffffff'"
      :textAlign="currentStyle.textAlign || 'left'"
      :numberFormat="currentStyle.numberFormat || 'general'"
      :frozenRows="store.frozenRows"
      :frozenCols="store.frozenCols"
      :hasFilter="store.filters.size > 0"
      @undo="handleUndo"
      @redo="handleRedo"
      @cut="handleCut"
      @copy="handleCopy"
      @paste="handlePaste"
      @fontFamily="(v) => applyStyle({ fontFamily: v })"
      @fontSize="(v) => applyStyle({ fontSize: v })"
      @bold="toggleStyle('bold')"
      @italic="toggleStyle('italic')"
      @underline="toggleStyle('underline')"
      @color="(v) => applyStyle({ color: v })"
      @backgroundColor="(v) => applyStyle({ backgroundColor: v })"
      @alignLeft="applyStyle({ textAlign: 'left' })"
      @alignCenter="applyStyle({ textAlign: 'center' })"
      @alignRight="applyStyle({ textAlign: 'right' })"
      @numberFormat="(v) => applyStyle({ numberFormat: v as any })"
      @merge="handleMerge"
      @unmerge="handleUnmerge"
      @freezeRow="toggleFreezeRow"
      @freezeCol="toggleFreezeCol"
      @sortAsc="handleSort('asc')"
      @sortDesc="handleSort('desc')"
      @filter="toggleFilter"
      @addChart="handleAddChart"
      @exportCsv="handleExportCsv"
      @exportExcel="handleExportExcel"
      @clear="handleClear"
    />

    <div class="formula-bar">
      <span class="cell-address">{{ currentCellAddress }}</span>
      <input
        v-model="formulaInput"
        @keyup.enter="handleFormulaSubmit"
        @blur="handleFormulaSubmit"
        placeholder="输入值或公式 (以 = 开头)"
      />
    </div>

    <div 
      class="grid-container" 
      ref="gridContainerRef"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
    >
      <canvas ref="canvasRef"></canvas>
      
      <input
        v-if="store.editingCell"
        ref="cellInputRef"
        v-model="cellInputValue"
        class="cell-editor"
        :style="cellEditorStyle"
        @keyup.enter="handleCellEditSubmit"
        @keyup.esc="handleCellEditCancel"
        @blur="handleCellEditSubmit"
      />

      <ChartRenderer
        v-for="chart in store.charts"
        :key="chart.id"
        :chart="chart"
        :cells="store.cells"
        @close="store.removeChart($event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useSpreadsheetStore } from '../store/spreadsheetStore'
import { CanvasRenderer } from '../engine/CanvasRenderer'
import { workerManager } from '../workers/WorkerManager'
import { parseFormula } from '../formula/FormulaParser'
import { exportToCSV, exportToExcel, copyToClipboard, pasteFromClipboard } from '../utils/exportUtils'
import { 
  POSITION_TO_A1, CELL_KEY, IS_IN_RANGE, NORMALIZE_RANGE 
} from '../utils/cellUtils'
import Toolbar from './Toolbar.vue'
import ChartRenderer from './ChartRenderer.vue'
import type { CellStyle, CellPosition, CellRange } from '../types'

const store = useSpreadsheetStore()

const containerRef = ref<HTMLElement | null>(null)
const gridContainerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const cellInputRef = ref<HTMLInputElement | null>(null)

const renderer = ref<CanvasRenderer | null>(null)
const isDragging = ref(false)
const isDraggingFill = ref(false)
const dragStart = ref<CellPosition | null>(null)
const scrollTop = ref(0)
const scrollLeft = ref(0)
const formulaInput = ref('')
const cellInputValue = ref('')

const ROW_COUNT = 1000
const COL_COUNT = 100
const SCROLL_SPEED = 50

const currentCellAddress = computed(() => {
  if (store.selectedCell) {
    return POSITION_TO_A1(store.selectedCell.row, store.selectedCell.col)
  }
  return ''
})

const currentStyle = computed<CellStyle>(() => {
  if (store.selectedCell) {
    const cell = store.getCell(store.selectedCell.row, store.selectedCell.col)
    return cell?.style || {}
  }
  return {}
})

const cellEditorStyle = computed(() => {
  if (!store.editingCell || !renderer.value) return {}
  
  const bounds = renderer.value.getCellBounds(
    store.editingCell.row,
    store.editingCell.col,
    scrollTop.value,
    scrollLeft.value
  )
  
  const cell = store.getCell(store.editingCell.row, store.editingCell.col)
  
  return {
    left: bounds.x + 'px',
    top: bounds.y + 'px',
    width: bounds.width + 'px',
    height: bounds.height + 'px',
    fontFamily: cell?.style?.fontFamily || 'system-ui, sans-serif',
    fontSize: (cell?.style?.fontSize || 13) + 'px',
    fontWeight: cell?.style?.bold ? 'bold' : 'normal',
    fontStyle: cell?.style?.italic ? 'italic' : 'normal',
    textAlign: cell?.style?.textAlign || 'left',
    color: cell?.style?.color || '#1f2937',
    backgroundColor: cell?.style?.backgroundColor || '#ffffff'
  }
})

const initRenderer = () => {
  if (!canvasRef.value || !gridContainerRef.value) return
  
  renderer.value = new CanvasRenderer(canvasRef.value, gridContainerRef.value)
  updateRendererOptions()
  render()
}

const updateRendererOptions = () => {
  if (!renderer.value) return
  
  renderer.value.updateOptions({
    container: gridContainerRef.value!,
    scrollTop: scrollTop.value,
    scrollLeft: scrollLeft.value,
    frozenRows: store.frozenRows,
    frozenCols: store.frozenCols,
    rowCount: ROW_COUNT,
    colCount: COL_COUNT,
    getRowHeight: store.getRowHeight,
    getColWidth: store.getColWidth,
    getCell: store.getCell,
    getMergeInfo: store.getMergeInfo,
    selectedCell: store.selectedCell,
    selectedRange: store.selectedRange,
    mergedCells: store.mergedCells
  })
}

const render = () => {
  if (renderer.value) {
    updateRendererOptions()
    renderer.value.render()
  }
}

const handleWheel = (e: WheelEvent) => {
  e.preventDefault()
  
  const maxScrollTop = ROW_COUNT * store.getRowHeight(0) - gridContainerRef.value!.clientHeight
  const maxScrollLeft = COL_COUNT * store.getColWidth(0) - gridContainerRef.value!.clientWidth
  
  scrollTop.value = Math.max(0, Math.min(maxScrollTop, scrollTop.value + e.deltaY))
  scrollLeft.value = Math.max(0, Math.min(maxScrollLeft, scrollLeft.value + e.deltaX))
  
  render()
}

const handleMouseDown = (e: MouseEvent) => {
  if (!renderer.value) return
  
  const pos = renderer.value.getCellAtPosition(e.clientX, e.clientY)
  if (!pos) return
  
  if (renderer.value.isOverFillHandle(e.clientX, e.clientY)) {
    isDraggingFill.value = true
    dragStart.value = store.selectedCell
    return
  }
  
  if (e.shiftKey && store.selectedCell) {
    store.selectRange({
      start: store.selectedCell,
      end: pos
    })
  } else {
    store.selectCell(pos.row, pos.col)
    formulaInput.value = store.getCell(pos.row, pos.col)?.formula || 
      String(store.getCell(pos.row, pos.col)?.value || '')
  }
  
  isDragging.value = true
  dragStart.value = pos
  render()
}

const handleMouseMove = (e: MouseEvent) => {
  if (!renderer.value) return
  
  if (renderer.value.isOverFillHandle(e.clientX, e.clientY)) {
    gridContainerRef.value!.style.cursor = 'crosshair'
  } else {
    gridContainerRef.value!.style.cursor = 'default'
  }
  
  if (!isDragging.value && !isDraggingFill.value) return
  
  const pos = renderer.value.getCellAtPosition(e.clientX, e.clientY)
  if (!pos || !dragStart.value) return
  
  if (isDraggingFill.value && store.selectedCell) {
    const range = {
      start: store.selectedCell,
      end: pos
    }
    store.selectRange(range)
  } else {
    const range = {
      start: dragStart.value,
      end: pos
    }
    store.selectRange(range)
  }
  
  render()
}

const handleMouseUp = () => {
  if (isDraggingFill.value && store.selectedRange && dragStart.value) {
    handleFill()
  }
  isDragging.value = false
  isDraggingFill.value = false
  dragStart.value = null
}

const handleFill = () => {
  if (!store.selectedRange || !store.selectedCell) return
  
  const { start, end } = NORMALIZE_RANGE(store.selectedRange)
  const sourceCell = store.getCell(store.selectedCell.row, store.selectedCell.col)
  
  if (!sourceCell) return
  
  if (end.row > start.row) {
    for (let r = start.row + 1; r <= end.row; r++) {
      const above = store.getCell(r - 1, start.col)
      if (above && typeof above.value === 'number') {
        store.setCell(r, start.col, { 
          value: above.value + 1,
          style: { ...sourceCell.style }
        }, false)
      } else {
        store.setCell(r, start.col, { 
          ...sourceCell,
          value: sourceCell.value
        }, false)
      }
    }
  }
  
  if (end.col > start.col) {
    for (let c = start.col + 1; c <= end.col; c++) {
      const left = store.getCell(start.row, c - 1)
      if (left && typeof left.value === 'number') {
        store.setCell(start.row, c, { 
          value: left.value + 1,
          style: { ...sourceCell.style }
        }, false)
      } else {
        store.setCell(start.row, c, { 
          ...sourceCell,
          value: sourceCell.value
        }, false)
      }
    }
  }
  
  recalculateFormulas()
  render()
}

const applyStyle = (style: Partial<CellStyle>) => {
  const range = store.selectedRange || (store.selectedCell ? {
    start: store.selectedCell,
    end: store.selectedCell
  } : null)
  
  if (!range) return
  
  store.applyStyle(range, style)
  render()
}

const toggleStyle = (prop: keyof CellStyle) => {
  const current = currentStyle.value[prop] as boolean
  applyStyle({ [prop]: !current })
}

const handleMerge = () => {
  if (!store.selectedRange) return
  store.mergeCells(store.selectedRange)
  render()
}

const handleUnmerge = () => {
  if (!store.selectedRange) return
  store.unmergeCells(store.selectedRange)
  render()
}

const toggleFreezeRow = () => {
  store.frozenRows = store.frozenRows > 0 ? 0 : 1
  render()
}

const toggleFreezeCol = () => {
  store.frozenCols = store.frozenCols > 0 ? 0 : 1
  render()
}

const handleSort = (direction: 'asc' | 'desc') => {
  if (!store.selectedRange || !store.selectedCell) return
  
  const { start, end } = NORMALIZE_RANGE(store.selectedRange)
  const sortCol = store.selectedCell.col
  
  const data: { row: number; values: any[] }[] = []
  
  for (let r = start.row; r <= end.row; r++) {
    const rowValues: any[] = []
    for (let c = start.col; c <= end.col; c++) {
      rowValues.push(store.getCell(r, c)?.value ?? null)
    }
    data.push({ row: r, values: rowValues })
  }
  
  const colIndex = sortCol - start.col
  data.sort((a, b) => {
    const aVal = a.values[colIndex]
    const bVal = b.values[colIndex]
    
    if (aVal === null && bVal === null) return 0
    if (aVal === null) return 1
    if (bVal === null) return -1
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return direction === 'asc' ? aVal - bVal : bVal - aVal
    }
    
    return direction === 'asc' 
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal))
  })
  
  data.forEach((item, index) => {
    for (let c = start.col; c <= end.col; c++) {
      const cell = store.getCell(item.row, c)
      if (cell) {
        store.setCell(start.row + index, c, { ...cell }, false)
      } else {
        store.cells.delete(CELL_KEY(start.row + index, c))
      }
    }
  })
  
  render()
}

const toggleFilter = () => {
  if (store.filters.size > 0) {
    store.clearFilters()
  } else if (store.selectedRange) {
    const { start, end } = NORMALIZE_RANGE(store.selectedRange)
    for (let c = start.col; c <= end.col; c++) {
      store.setFilter({
        column: c,
        operator: 'equals',
        value: ''
      })
    }
  }
  render()
}

const handleAddChart = (type: string) => {
  if (!store.selectedRange) {
    alert('请先选择数据范围')
    return
  }
  
  store.addChart({
    type: type as any,
    title: `${type === 'bar' ? '柱状图' : type === 'line' ? '折线图' : '饼图'}`,
    dataRange: store.selectedRange,
    position: { x: 100, y: 100 },
    size: { width: 400, height: 300 }
  })
}

const handleClear = () => {
  const range = store.selectedRange || (store.selectedCell ? {
    start: store.selectedCell,
    end: store.selectedCell
  } : null)
  
  if (!range) return
  
  if (confirm('确定要清除所选区域的内容吗？')) {
    store.clearRange(range)
    render()
  }
}

const handleUndo = () => {
  store.undo()
  render()
}

const handleRedo = () => {
  store.redo()
  render()
}

const handleCut = async () => {
  await handleCopy()
  handleClear()
}

const handleCopy = async () => {
  const range = store.selectedRange || (store.selectedCell ? {
    start: store.selectedCell,
    end: store.selectedCell
  } : null)
  
  if (!range) return
  
  const success = await copyToClipboard(store.cells, range)
  if (!success) {
    alert('复制失败，请使用 Ctrl+C')
  }
}

const handlePaste = async () => {
  if (!store.selectedCell) return
  
  const data = await pasteFromClipboard()
  if (!data) {
    alert('粘贴失败，请使用 Ctrl+V')
    return
  }
  
  const { row, col } = store.selectedCell
  
  data.forEach((rowData, r) => {
    rowData.forEach((value, c) => {
      if (value !== '') {
        let cellValue: any = value
        if (!isNaN(Number(value))) {
          cellValue = Number(value)
        }
        store.setCell(row + r, col + c, { value: cellValue }, false)
      }
    })
  })
  
  recalculateFormulas()
  render()
}

const handleExportCsv = () => {
  exportToCSV(store.cells, store.getUsedRange())
}

const handleExportExcel = () => {
  exportToExcel(store.cells, store.getUsedRange())
}

const handleFormulaSubmit = () => {
  if (!store.selectedCell) return
  
  const { row, col } = store.selectedCell
  const value = formulaInput.value
  
  if (value.startsWith('=')) {
    const result = parseFormula(value, row, col, store.cells)
    store.setCell(row, col, {
      formula: value,
      value: result.error ? result.error : result.value
    })
    recalculateFormulas()
  } else {
    let cellValue: any = value
    if (!isNaN(Number(value)) && value !== '') {
      cellValue = Number(value)
    }
    store.setCell(row, col, { value: cellValue, formula: undefined })
    recalculateFormulas()
  }
  
  render()
}

const handleCellEditSubmit = () => {
  if (!store.editingCell) return
  
  const { row, col } = store.editingCell
  const value = cellInputValue.value
  
  if (value.startsWith('=')) {
    const result = parseFormula(value, row, col, store.cells)
    store.setCell(row, col, {
      formula: value,
      value: result.error ? result.error : result.value
    })
    formulaInput.value = value
  } else {
    let cellValue: any = value
    if (!isNaN(Number(value)) && value !== '') {
      cellValue = Number(value)
    }
    store.setCell(row, col, { value: cellValue, formula: undefined })
    formulaInput.value = value
  }
  
  store.stopEditing()
  recalculateFormulas()
  render()
}

const handleCellEditCancel = () => {
  store.stopEditing()
}

const recalculateFormulas = async () => {
  store.isCalculating = true
  try {
    store.recalculateAllFormulas()
  } catch (e) {
    console.warn('Formula calculation failed', e)
  }
  store.isCalculating = false
  render()
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (store.editingCell) return
  
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey
  
  if (ctrlOrCmd && e.key === 'z') {
    e.preventDefault()
    store.undo()
    render()
    return
  }
  
  if (ctrlOrCmd && e.key === 'y') {
    e.preventDefault()
    store.redo()
    render()
    return
  }
  
  if (ctrlOrCmd && e.key === 'c') {
    e.preventDefault()
    handleCopy()
    return
  }
  
  if (ctrlOrCmd && e.key === 'x') {
    e.preventDefault()
    handleCut()
    return
  }
  
  if (ctrlOrCmd && e.key === 'v') {
    e.preventDefault()
    handlePaste()
    return
  }
  
  if (ctrlOrCmd && e.key === 'b') {
    e.preventDefault()
    toggleStyle('bold')
    return
  }
  
  if (ctrlOrCmd && e.key === 'i') {
    e.preventDefault()
    toggleStyle('italic')
    return
  }
  
  if (ctrlOrCmd && e.key === 'u') {
    e.preventDefault()
    toggleStyle('underline')
    return
  }
  
  if (!store.selectedCell) return
  
  if (e.key === 'Enter' || e.key === 'F2') {
    e.preventDefault()
    startEditing()
    return
  }
  
  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault()
    handleClear()
    return
  }
  
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault()
    const { row, col } = store.selectedCell
    let newRow = row
    let newCol = col
    
    switch (e.key) {
      case 'ArrowUp': newRow = Math.max(0, row - 1); break
      case 'ArrowDown': newRow = Math.min(ROW_COUNT - 1, row + 1); break
      case 'ArrowLeft': newCol = Math.max(0, col - 1); break
      case 'ArrowRight': newCol = Math.min(COL_COUNT - 1, col + 1); break
    }
    
    if (e.shiftKey) {
      store.selectRange({
        start: store.selectedRange?.start || store.selectedCell,
        end: { row: newRow, col: newCol }
      })
    } else {
      store.selectCell(newRow, newCol)
    }
    
    render()
    return
  }
  
  if (e.key.length === 1 && !ctrlOrCmd && !e.altKey) {
    e.preventDefault()
    store.startEditing(store.selectedCell.row, store.selectedCell.col)
    cellInputValue.value = e.key
    nextTick(() => {
      cellInputRef.value?.focus()
    })
  }
}

const startEditing = () => {
  if (!store.selectedCell) return
  
  const cell = store.getCell(store.selectedCell.row, store.selectedCell.col)
  store.startEditing(store.selectedCell.row, store.selectedCell.col)
  cellInputValue.value = cell?.formula || String(cell?.value || '')
  
  nextTick(() => {
    cellInputRef.value?.focus()
    cellInputRef.value?.select()
  })
}

watch(() => store.selectedCell, (newCell) => {
  if (newCell) {
    const cell = store.getCell(newCell.row, newCell.col)
    formulaInput.value = cell?.formula || String(cell?.value || '')
  }
})

watch(() => store.cells.size, () => {
  render()
})

onMounted(() => {
  initRenderer()
  window.addEventListener('keydown', handleKeyDown)
  
  window.addEventListener('resize', render)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('resize', render)
  workerManager.terminate()
})

defineExpose({
  store,
  render
})
</script>

<style scoped>
.spreadsheet-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: white;
}

.formula-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.cell-address {
  min-width: 60px;
  padding: 6px 12px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  text-align: center;
}

.formula-bar input {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
  font-family: 'Consolas', 'Monaco', monospace;
}

.formula-bar input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.grid-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: white;
}

.grid-container canvas {
  display: block;
}

.cell-editor {
  position: absolute;
  border: 2px solid #3b82f6;
  outline: none;
  padding: 0 8px;
  margin: 0;
  box-sizing: border-box;
  background: white;
  z-index: 100;
  font-family: inherit;
}
</style>
