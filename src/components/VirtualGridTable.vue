<template>
  <div class="virtual-grid-table" ref="tableContainerRef" :style="containerStyle">
    <div class="header-wrapper" ref="headerWrapperRef" :style="headerWrapperStyle">
      <div
        class="frozen-header-left"
        v-if="frozenColCount > 0"
        :style="frozenHeaderLeftStyle"
      >
        <div
          class="header-row"
          v-for="(row, rowIdx) in headerRows"
          :key="rowIdx"
          :style="getHeaderRowStyle(rowIdx)"
        >
          <div
            class="header-cell frozen-left"
            v-for="colIdx in frozenColIndices"
            :key="`${rowIdx}-${colIdx}`"
            :style="getHeaderCellStyle(rowIdx, colIdx)"
            @click="handleHeaderClick(colIdx)"
          >
            <div class="header-cell-content">
              <span class="header-text">{{ getHeaderText(rowIdx, colIdx) }}</span>
              <el-icon
                v-if="rowIdx === headerRows.length - 1 && sortableColumns.includes(colIdx)"
                class="sort-icon"
                :class="{ active: sortColumn === colIdx }"
                @click.stop="toggleSort(colIdx)"
              >
                <Sort v-if="sortColumn !== colIdx" />
                <CaretTop v-else-if="sortOrder === 'asc'" />
                <CaretBottom v-else />
              </el-icon>
            </div>
            <div
              v-if="rowIdx === headerRows.length - 1"
              class="resize-handle"
              @mousedown.stop="handleResizeStart($event, colIdx)"
            ></div>
          </div>
        </div>
      </div>

      <div
        class="main-header"
        ref="mainHeaderRef"
        :style="mainHeaderStyle"
        @scroll="handleHeaderScroll"
      >
        <div class="header-inner" :style="headerInnerStyle">
          <div
            class="header-row"
            v-for="(row, rowIdx) in headerRows"
            :key="rowIdx"
            :style="getHeaderRowStyle(rowIdx)"
          >
            <div
              class="header-cell"
              v-for="colIdx in visibleColIndices"
              :key="`${rowIdx}-${colIdx}`"
              :style="getHeaderCellStyle(rowIdx, colIdx)"
              @click="handleHeaderClick(colIdx)"
            >
              <div class="header-cell-content">
                <span class="header-text">{{ getHeaderText(rowIdx, colIdx) }}</span>
                <el-icon
                  v-if="rowIdx === headerRows.length - 1 && sortableColumns.includes(colIdx)"
                  class="sort-icon"
                  :class="{ active: sortColumn === colIdx }"
                  @click.stop="toggleSort(colIdx)"
                >
                  <Sort v-if="sortColumn !== colIdx" />
                  <CaretTop v-else-if="sortOrder === 'asc'" />
                  <CaretBottom v-else />
                </el-icon>
              </div>
              <div
                v-if="rowIdx === headerRows.length - 1"
                class="resize-handle"
                @mousedown.stop="handleResizeStart($event, colIdx)"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="body-wrapper"
      ref="bodyWrapperRef"
      :style="bodyWrapperStyle"
      @scroll="handleBodyScroll"
    >
      <div class="body-inner" :style="bodyInnerStyle">
        <div
          v-if="frozenColCount > 0"
          class="frozen-body-left"
          :style="frozenBodyLeftStyle"
        >
          <div
            class="body-row"
            v-for="rowIdx in visibleRowIndices"
            :key="rowIdx"
            :style="getRowStyle(rowIdx)"
          >
            <div
              class="body-cell frozen-left"
              v-for="colIdx in frozenColIndices"
              :key="`${rowIdx}-${colIdx}`"
              :style="getCellStyle(rowIdx, colIdx)"
              @click="handleCellClick(rowIdx, colIdx)"
              @dblclick="handleCellDblClick(rowIdx, colIdx)"
            >
              <div class="cell-content" v-if="!(editingCell?.row === rowIdx && editingCell?.col === colIdx)">
                {{ getCellValue(rowIdx, colIdx) }}
              </div>
              <el-input
                v-else
                ref="editingInputRef"
                v-model="editingValue"
                size="small"
                :style="{ width: '100%', height: '100%' }"
                @blur="handleEditBlur"
                @keyup.enter="handleEditBlur"
                @keyup.esc="cancelEdit"
              />
            </div>
          </div>
        </div>

        <div class="main-body" :style="mainBodyStyle">
          <div
            class="body-row"
            v-for="rowIdx in visibleRowIndices"
            :key="rowIdx"
            :style="getRowStyle(rowIdx)"
          >
            <div
              class="body-cell"
              v-for="colIdx in visibleColIndices"
              :key="`${rowIdx}-${colIdx}`"
              :style="getCellStyle(rowIdx, colIdx)"
              @click="handleCellClick(rowIdx, colIdx)"
              @dblclick="handleCellDblClick(rowIdx, colIdx)"
            >
              <div class="cell-content" v-if="!(editingCell?.row === rowIdx && editingCell?.col === colIdx)">
                {{ getCellValue(rowIdx, colIdx) }}
              </div>
              <el-input
                v-else
                ref="editingInputRef"
                v-model="editingValue"
                size="small"
                :style="{ width: '100%', height: '100%' }"
                @blur="handleEditBlur"
                @keyup.enter="handleEditBlur"
                @keyup.esc="cancelEdit"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Sort, CaretTop, CaretBottom } from '@element-plus/icons-vue'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  columns: {
    type: Array,
    default: () => []
  },
  rowHeight: {
    type: Number,
    default: 48
  },
  defaultColumnWidth: {
    type: Number,
    default: 120
  },
  columnWidths: {
    type: Object,
    default: () => ({})
  },
  frozenColCount: {
    type: Number,
    default: 0
  },
  frozenRowCount: {
    type: Number,
    default: 0
  },
  sortable: {
    type: Boolean,
    default: false
  },
  sortableColumns: {
    type: Array,
    default: () => []
  },
  height: {
    type: [Number, String],
    default: 'calc(100vh - 100px)'
  },
  headerHeight: {
    type: Number,
    default: 48
  }
})

const emit = defineEmits(['sort-change', 'cell-edit', 'header-click'])

const tableContainerRef = ref(null)
const headerWrapperRef = ref(null)
const mainHeaderRef = ref(null)
const bodyWrapperRef = ref(null)
const editingInputRef = ref(null)

const scrollTop = ref(0)
const scrollLeft = ref(0)
const containerWidth = ref(1000)
const containerHeight = ref(600)

const editingCell = ref(null)
const editingValue = ref('')

const internalColumnWidths = ref({ ...props.columnWidths })

const sortColumn = ref(null)
const sortOrder = ref('asc')

const resizing = ref(false)
const resizeCol = ref(null)
const resizeStartX = ref(0)
const resizeStartWidth = ref(0)

const totalRowCount = computed(() => props.data.length)
const totalColCount = computed(() => props.columns.length)

const headerRows = computed(() => {
  if (props.columns.length === 0) return [[]]
  const maxDepth = getMaxHeaderDepth(props.columns)
  const rows = []
  for (let i = 0; i < maxDepth; i++) {
    rows.push([])
  }
  flattenHeaders(props.columns, rows, 0, 0)
  return rows
})

const headerRowsCount = computed(() => headerRows.value.length)
const totalHeaderHeight = computed(() => headerRowsCount.value * props.headerHeight)

const visibleRowIndices = computed(() => {
  if (totalRowCount.value === 0) return []
  const start = Math.floor(scrollTop.value / props.rowHeight)
  const end = Math.min(
    totalRowCount.value,
    Math.ceil((scrollTop.value + containerHeight.value - totalHeaderHeight.value) / props.rowHeight) + 1
  )
  const indices = []
  for (let i = Math.max(0, start); i < end; i++) {
    indices.push(i)
  }
  return indices
})

const visibleColIndices = computed(() => {
  if (totalColCount.value === 0) return []
  let currentWidth = 0
  const start = Math.max(props.frozenColCount, findColumnIndexByOffset(scrollLeft.value))
  const indices = []
  let accumulated = 0
  
  for (let i = 0; i < start; i++) {
    accumulated += getColumnWidth(i)
  }
  
  for (let i = start; i < totalColCount.value; i++) {
    const width = getColumnWidth(i)
    if (accumulated >= scrollLeft.value + containerWidth.value + 200) break
    indices.push(i)
    accumulated += width
  }
  return indices
})

const frozenColIndices = computed(() => {
  const indices = []
  for (let i = 0; i < props.frozenColCount; i++) {
    indices.push(i)
  }
  return indices
})

const totalWidth = computed(() => {
  let total = 0
  for (let i = 0; i < totalColCount.value; i++) {
    total += getColumnWidth(i)
  }
  return total
})

const totalHeight = computed(() => totalRowCount.value * props.rowHeight)

const frozenColsWidth = computed(() => {
  let total = 0
  for (let i = 0; i < props.frozenColCount; i++) {
    total += getColumnWidth(i)
  }
  return total
})

const containerStyle = computed(() => ({
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
  position: 'relative',
  overflow: 'hidden'
}))

const headerWrapperStyle = computed(() => ({
  height: `${totalHeaderHeight.value}px`,
  position: 'relative',
  overflow: 'hidden'
}))

const mainHeaderStyle = computed(() => ({
  marginLeft: props.frozenColCount > 0 ? `${frozenColsWidth.value}px` : '0px',
  height: `${totalHeaderHeight.value}px`,
  overflow: 'hidden'
}))

const frozenHeaderLeftStyle = computed(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: `${frozenColsWidth.value}px`,
  height: `${totalHeaderHeight.value}px`,
  zIndex: 10,
  overflow: 'hidden'
}))

const headerInnerStyle = computed(() => ({
  width: `${totalWidth.value}px`,
  height: `${totalHeaderHeight.value}px`,
  transform: `translateX(${-scrollLeft.value}px)`
}))

const bodyWrapperStyle = computed(() => ({
  height: `calc(100% - ${totalHeaderHeight.value}px)`,
  overflow: 'auto',
  position: 'relative'
}))

const bodyInnerStyle = computed(() => ({
  width: `${totalWidth.value}px`,
  height: `${totalHeight.value}px`,
  position: 'relative'
}))

const frozenBodyLeftStyle = computed(() => ({
  position: 'sticky',
  left: 0,
  width: `${frozenColsWidth.value}px`,
  zIndex: 5,
  overflow: 'hidden',
  transform: `translateY(${-scrollTop.value}px)`
}))

const mainBodyStyle = computed(() => ({
  position: 'absolute',
  top: 0,
  left: `${frozenColsWidth.value}px`,
  transform: `translate(${-scrollLeft.value}px, ${-scrollTop.value}px)`
}))

function getMaxHeaderDepth(columns) {
  let max = 1
  for (const col of columns) {
    if (col.children && col.children.length > 0) {
      const childDepth = getMaxHeaderDepth(col.children) + 1
      max = Math.max(max, childDepth)
    }
  }
  return max
}

function flattenHeaders(columns, rows, depth, startCol) {
  let currentCol = startCol
  for (const col of columns) {
    if (col.children && col.children.length > 0) {
      const colSpan = countColSpan(col)
      const rowSpan = 1
      rows[depth].push({
        ...col,
        colSpan,
        rowSpan,
        startCol: currentCol,
        isLeaf: false
      })
      flattenHeaders(col.children, rows, depth + 1, currentCol)
      currentCol += colSpan
    } else {
      const colSpan = 1
      const rowSpan = headerRowsCount.value - depth
      rows[depth].push({
        ...col,
        colSpan,
        rowSpan,
        startCol: currentCol,
        isLeaf: true
      })
      currentCol++
    }
  }
}

function countColSpan(column) {
  if (!column.children || column.children.length === 0) return 1
  let count = 0
  for (const child of column.children) {
    count += countColSpan(child)
  }
  return count
}

function findColumnIndexByOffset(offset) {
  let accumulated = 0
  for (let i = 0; i < totalColCount.value; i++) {
    const width = getColumnWidth(i)
    if (accumulated + width > offset) return i
    accumulated += width
  }
  return totalColCount.value - 1
}

function getColumnWidth(colIdx) {
  return internalColumnWidths.value[colIdx] ?? props.defaultColumnWidth
}

function getColumnOffset(colIdx) {
  let offset = 0
  for (let i = 0; i < colIdx; i++) {
    offset += getColumnWidth(i)
  }
  return offset
}

function getHeaderRowStyle(rowIdx) {
  return {
    height: `${props.headerHeight}px`,
    position: 'relative'
  }
}

function getHeaderCellStyle(rowIdx, colIdx) {
  const headerCell = headerRows.value[rowIdx].find(
    cell => cell.startCol <= colIdx && colIdx < cell.startCell + cell.colSpan
  ) || headerRows.value[rowIdx][0]
  
  const width = getColumnWidth(colIdx)
  const left = getColumnOffset(colIdx)
  
  return {
    width: `${width}px`,
    height: `${props.headerHeight * (headerCell?.rowSpan || 1)}px`,
    left: `${left}px`,
    position: 'absolute',
    lineHeight: `${props.headerHeight}px`
  }
}

function getHeaderText(rowIdx, colIdx) {
  const flatColumns = flattenAllColumns(props.columns)
  if (rowIdx === headerRowsCount.value - 1) {
    return flatColumns[colIdx]?.label || ''
  }
  
  for (const cell of headerRows.value[rowIdx]) {
    if (colIdx >= cell.startCol && colIdx < cell.startCol + cell.colSpan) {
      return cell.label || ''
    }
  }
  return ''
}

function flattenAllColumns(columns) {
  const result = []
  for (const col of columns) {
    if (col.children && col.children.length > 0) {
      result.push(...flattenAllColumns(col.children))
    } else {
      result.push(col)
    }
  }
  return result
}

function getRowStyle(rowIdx) {
  return {
    height: `${props.rowHeight}px`,
    top: `${rowIdx * props.rowHeight}px`,
    position: 'absolute',
    width: `${totalWidth.value}px`
  }
}

function getCellStyle(rowIdx, colIdx) {
  const width = getColumnWidth(colIdx)
  const left = getColumnOffset(colIdx)
  return {
    width: `${width}px`,
    height: `${props.rowHeight}px`,
    left: `${left}px`,
    position: 'absolute',
    lineHeight: `${props.rowHeight}px`
  }
}

function getCellValue(rowIdx, colIdx) {
  const flatColumns = flattenAllColumns(props.columns)
  const col = flatColumns[colIdx]
  if (!col || !props.data[rowIdx]) return ''
  
  const value = props.data[rowIdx][col.prop]
  if (col.formatter) {
    return col.formatter(props.data[rowIdx], col, value, rowIdx)
  }
  return value ?? ''
}

function handleBodyScroll(e) {
  scrollTop.value = e.target.scrollTop
  scrollLeft.value = e.target.scrollLeft
  
  if (mainHeaderRef.value) {
    mainHeaderRef.value.scrollLeft = e.target.scrollLeft
  }
}

function handleHeaderScroll(e) {
  if (bodyWrapperRef.value) {
    bodyWrapperRef.value.scrollLeft = e.target.scrollLeft
  }
}

function handleHeaderClick(colIdx) {
  const flatColumns = flattenAllColumns(props.columns)
  emit('header-click', flatColumns[colIdx], colIdx)
}

function toggleSort(colIdx) {
  if (!props.sortable && !props.sortableColumns.includes(colIdx)) return
  
  const flatColumns = flattenAllColumns(props.columns)
  const col = flatColumns[colIdx]
  
  if (sortColumn.value === colIdx) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = colIdx
    sortOrder.value = 'asc'
  }
  
  emit('sort-change', {
    column: col,
    prop: col?.prop,
    order: sortOrder.value
  })
}

function handleCellClick(rowIdx, colIdx) {
  if (editingCell.value && (editingCell.value.row !== rowIdx || editingCell.value.col !== colIdx)) {
    handleEditBlur()
  }
}

function handleCellDblClick(rowIdx, colIdx) {
  const flatColumns = flattenAllColumns(props.columns)
  const col = flatColumns[colIdx]
  
  if (col?.editable === false) return
  
  editingCell.value = { row: rowIdx, col: colIdx }
  editingValue.value = getCellValue(rowIdx, colIdx)
  
  nextTick(() => {
    if (editingInputRef.value) {
      const inputEl = editingInputRef.value.$el?.querySelector?.('input') || editingInputRef.value
      inputEl?.focus?.()
      inputEl?.select?.()
    }
  })
}

function handleEditBlur() {
  if (!editingCell.value) return
  
  const { row, col } = editingCell.value
  const flatColumns = flattenAllColumns(props.columns)
  const column = flatColumns[col]
  const rowData = props.data[row]
  
  emit('cell-edit', {
    row,
    col,
    rowData,
    column,
    value: editingValue.value
  })
  
  editingCell.value = null
  editingValue.value = ''
}

function cancelEdit() {
  editingCell.value = null
  editingValue.value = ''
}

function handleResizeStart(e, colIdx) {
  resizing.value = true
  resizeCol.value = colIdx
  resizeStartX.value = e.client