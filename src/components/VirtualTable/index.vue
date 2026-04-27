<template>
  <div class="virtual-table-container" ref="containerRef">
    <div class="virtual-table-header-wrapper" :style="{ height: actualHeaderHeight + 'px' }">
      <div
        class="virtual-table-header-scroll"
        :style="{ width: totalWidth + 'px' }"
      >
        <table class="virtual-table-header" :style="{ width: totalWidth + 'px' }">
          <thead>
            <tr v-for="(headerRow, rowIndex) in headerRows" :key="rowIndex">
              <th
                v-for="(cell, cellIndex) in headerRow"
                :key="cellIndex"
                class="virtual-table-header-cell"
                :class="[
                  { 'is-fixed-left': cell.fixed === 'left' },
                  { 'is-fixed-right': cell.fixed === 'right' },
                  { 'is-sortable': cell.sortable },
                  { 'is-sorted': cell.sortOrder },
                  { 'is-editing': editingCell?.rowIndex === -1 && editingCell?.colIndex === cell.colIndex }
                ]"
                :style="getHeaderCellStyle(cell, rowIndex)"
                :colspan="cell.colSpan"
                :rowspan="cell.rowSpan"
                :data-col-index="cell.colIndex"
                :data-row-index="-1"
                @click="handleHeaderClick(cell)"
                @mousedown="handleHeaderMouseDown($event, cell)"
              >
                <div class="cell-content">
                  <span>{{ cell.label }}</span>
                  <span v-if="cell.sortable" class="sort-icon">
                    <el-icon v-if="cell.sortOrder === 'asc'"><CaretTop /></el-icon>
                    <el-icon v-else-if="cell.sortOrder === 'desc'"><CaretBottom /></el-icon>
                    <el-icon v-else><Sort /></el-icon>
                  </span>
                </div>
                <div
                  v-if="cell.resizable"
                  class="resize-handle"
                  :data-col-index="cell.colIndex"
                  @mousedown="handleResizeStart($event, cell)"
                ></div>
              </th>
            </tr>
          </thead>
        </table>
      </div>
    </div>

    <div
      class="virtual-table-body"
      ref="bodyRef"
      :style="{ height: bodyHeight + 'px' }"
      @scroll="handleScroll"
    >
      <div class="virtual-table-body-inner" :style="{ width: totalWidth + 'px', height: totalHeight + 'px' }">
        <div
          v-for="row in visibleRows"
          :key="row.rowIndex"
          class="virtual-table-row"
          :class="{ 'is-row-hover': hoverRowIndex === row.rowIndex }"
          :style="{
            top: row.top + 'px',
            height: rowHeight + 'px',
            width: totalWidth + 'px'
          }"
          :data-row-index="row.rowIndex"
          @mouseenter="hoverRowIndex = row.rowIndex"
          @mouseleave="hoverRowIndex = -1"
        >
          <table class="virtual-table-row-table" :style="{ width: totalWidth + 'px' }">
            <tbody>
              <tr>
                <td
                  v-for="cell in row.cells"
                  :key="cell.colIndex"
                  class="virtual-table-cell"
                  :class="[
                    { 'is-fixed-left': cell.fixed === 'left' },
                    { 'is-fixed-right': cell.fixed === 'right' },
                    { 'is-editing': editingCell?.rowIndex === row.rowIndex && editingCell?.colIndex === cell.colIndex }
                  ]"
                  :style="getCellStyle(cell, row.rowIndex)"
                  :data-row-index="row.rowIndex"
                  :data-col-index="cell.colIndex"
                  @click="handleCellClick($event, row.rowIndex, cell.colIndex)"
                  @dblclick="handleCellDblClick($event, row.rowIndex, cell.colIndex)"
                >
                  <div class="cell-content">
                    <template v-if="editingCell?.rowIndex === row.rowIndex && editingCell?.colIndex === cell.colIndex">
                      <el-input
                        ref="editingInputRef"
                        v-model="editingValue"
                        size="small"
                        @blur="handleEditBlur"
                        @keyup.enter="handleEditConfirm"
                        @keyup.esc="handleEditCancel"
                      />
                    </template>
                    <template v-else>
                      <span>{{ formatCellValue(cell.value, cell) }}</span>
                    </template>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="virtual-table-scrollbar-x" ref="scrollbarXRef" @scroll="handleScrollbarXScroll">
      <div :style="{ width: totalWidth + 'px', height: '1px' }"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick, markRaw } from 'vue'
import { CaretTop, CaretBottom, Sort } from '@element-plus/icons-vue'

const props = defineProps({
  columns: {
    type: Array,
    required: true
  },
  data: {
    type: Array,
    required: true
  },
  rowHeight: {
    type: Number,
    default: 48
  },
  headerHeight: {
    type: Number,
    default: 48
  },
  height: {
    type: Number,
    default: 500
  },
  frozenColumns: {
    type: Number,
    default: 0
  },
  frozenTrailingColumns: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['cell-click', 'cell-edit', 'sort-change'])

const containerRef = ref(null)
const bodyRef = ref(null)
const scrollbarXRef = ref(null)
const editingInputRef = ref(null)

const scrollTop = ref(0)
const scrollLeft = ref(0)
const hoverRowIndex = ref(-1)
const editingCell = ref(null)
const editingValue = ref('')
const resizingCol = ref(null)
const resizingStartX = ref(0)
const resizingStartWidth = ref(0)
const columnWidths = ref({})

const visibleRowCount = computed(() => {
  return Math.ceil(props.height / props.rowHeight) + 2
})

const startRowIndex = computed(() => {
  return Math.max(0, Math.floor(scrollTop.value / props.rowHeight) - 1)
})

const endRowIndex = computed(() => {
  return Math.min(props.data.length, startRowIndex.value + visibleRowCount.value)
})

const totalWidth = computed(() => {
  const calcWidth = (cols) => {
    return cols.reduce((sum, col) => {
      if (col.children) {
        return sum + calcWidth(col.children)
      }
      const width = columnWidths.value[col.prop] || col.width || 120
      return sum + width
    }, 0)
  }
  return calcWidth(props.columns)
})

const totalHeight = computed(() => {
  return props.data.length * props.rowHeight
})

const headerRowCount = computed(() => {
  return headerRows.value.length
})

const actualHeaderHeight = computed(() => {
  return headerRowCount.value * props.headerHeight
})

const bodyHeight = computed(() => {
  return props.height - actualHeaderHeight.value - 12
})

const flatColumns = computed(() => {
  const result = []
  const flatten = (cols, level = 0) => {
    cols.forEach(col => {
      if (col.children) {
        flatten(col.children, level + 1)
      } else {
        result.push({
          ...col,
          level,
          width: columnWidths.value[col.prop] || col.width || 120
        })
      }
    })
  }
  flatten(props.columns)
  return result
})

const headerRows = computed(() => {
  const maxLevel = getMaxLevel(props.columns)
  const rowCount = maxLevel + 1
  const rows = []
  
  for (let i = 0; i < rowCount; i++) {
    rows.push([])
  }
  
  let colIndex = 0
  const processColumns = (cols, level = 0) => {
    cols.forEach(col => {
      if (col.children) {
        const colspan = getColspan(col)
        const rowspan = 1
        rows[level].push({
          label: col.label,
          colSpan: colspan,
          rowSpan: rowspan,
          colIndex: colIndex,
          width: getGroupWidth(col),
          fixed: getFixedType(colIndex),
          sortable: false,
          resizable: false
        })
        colIndex += colspan
        processColumns(col.children, level + 1)
      } else {
        const rowspan = rowCount - level
        rows[level].push({
          label: col.label,
          colSpan: 1,
          rowSpan: rowspan,
          colIndex: colIndex,
          width: columnWidths.value[col.prop] || col.width || 120,
          fixed: getFixedType(colIndex),
          sortable: col.sortable,
          resizable: col.resizable !== false,
          prop: col.prop,
          sortOrder: col.sortOrder || null
        })
        colIndex++
      }
    })
  }
  
  processColumns(props.columns)
  return rows
})

const visibleRows = computed(() => {
  const rows = []
  for (let i = startRowIndex.value; i < endRowIndex.value; i++) {
    const rowData = props.data[i]
    const cells = flatColumns.value.map((col, colIndex) => ({
      colIndex,
      prop: col.prop,
      value: rowData[col.prop],
      width: col.width,
      fixed: getFixedType(colIndex)
    }))
    rows.push({
      rowIndex: i,
      top: i * props.rowHeight,
      cells
    })
  }
  return rows
})

const getMaxLevel = (cols, level = 0) => {
  let maxLevel = level
  cols.forEach(col => {
    if (col.children) {
      maxLevel = Math.max(maxLevel, getMaxLevel(col.children, level + 1))
    }
  })
  return maxLevel
}

const getColspan = (col) => {
  if (!col.children) return 1
  return col.children.reduce((sum, child) => sum + getColspan(child), 0)
}

const getGroupWidth = (col) => {
  if (!col.children) return columnWidths.value[col.prop] || col.width || 120
  return col.children.reduce((sum, child) => sum + getGroupWidth(child), 0)
}

const getFixedType = (colIndex) => {
  if (colIndex < props.frozenColumns) return 'left'
  if (colIndex >= flatColumns.value.length - props.frozenTrailingColumns) return 'right'
  return null
}

const getLeftFixedOffset = (colIndex) => {
  if (colIndex >= props.frozenColumns) return null
  let offset = 0
  for (let i = 0; i < colIndex; i++) {
    offset += flatColumns.value[i].width
  }
  return offset - scrollLeft.value
}

const getRightFixedOffset = (colIndex) => {
  if (colIndex < flatColumns.value.length - props.frozenTrailingColumns) return null
  let offset = 0
  for (let i = colIndex + 1; i < flatColumns.value.length; i++) {
    offset += flatColumns.value[i].width
  }
  return offset
}

const getHeaderCellStyle = (cell, rowIndex) => {
  const style = {
    width: cell.width + 'px',
    minWidth: cell.width + 'px'
  }
  if (cell.fixed === 'left') {
    style.left = getLeftFixedOffset(cell.colIndex) + 'px'
    style.zIndex = 10
  } else if (cell.fixed === 'right') {
    style.right = getRightFixedOffset(cell.colIndex) + 'px'
    style.zIndex = 10
  }
  if (cell.rowSpan > 1) {
    style.height = (cell.rowSpan * props.headerHeight) + 'px'
    style.lineHeight = (cell.rowSpan * props.headerHeight) + 'px'
  }
  return style
}

const getCellStyle = (cell, rowIndex) => {
  const style = {
    width: cell.width + 'px',
    minWidth: cell.width + 'px'
  }
  if (cell.fixed === 'left') {
    style.left = getLeftFixedOffset(cell.colIndex) + 'px'
    style.zIndex = 10
  } else if (cell.fixed === 'right') {
    style.right = getRightFixedOffset(cell.colIndex) + 'px'
    style.zIndex = 10
  }
  return style
}

const formatCellValue = (value, cell) => {
  if (value === null || value === undefined) return '-'
  return value
}

const handleScroll = (e) => {
  scrollTop.value = e.target.scrollTop
  scrollLeft.value = e.target.scrollLeft
  if (scrollbarXRef.value) {
    scrollbarXRef.value.scrollLeft = scrollLeft.value
  }
}

const handleScrollbarXScroll = (e) => {
  if (bodyRef.value) {
    bodyRef.value.scrollLeft = e.target.scrollLeft
  }
}

const handleHeaderClick = (cell) => {
  if (cell.sortable) {
    const currentOrder = cell.sortOrder
    let newOrder = null
    if (currentOrder === 'asc') {
      newOrder = 'desc'
    } else if (currentOrder === 'desc') {
      newOrder = null
    } else {
      newOrder = 'asc'
    }
    
    props.columns.forEach(col => {
      if (col.children) {
        col.children.forEach(child => {
          child.sortOrder = child.prop === cell.prop ? newOrder : null
        })
      } else {
        col.sortOrder = col.prop === cell.prop ? newOrder : null
      }
    })
    
    emit('sort-change', {
      prop: cell.prop,
      order: newOrder
    })
  }
}

const handleHeaderMouseDown = (e, cell) => {
}

const handleCellClick = (e, rowIndex, colIndex) => {
  emit('cell-click', {
    rowIndex,
    colIndex,
    row: props.data[rowIndex],
    column: flatColumns.value[colIndex]
  })
}

const handleCellDblClick = (e, rowIndex, colIndex) => {
  const col = flatColumns.value[colIndex]
  if (col.editable === false) return
  
  editingCell.value = { rowIndex, colIndex }
  editingValue.value = props.data[rowIndex][col.prop]
  
  nextTick(() => {
    if (editingInputRef.value) {
      editingInputRef.value.focus()
      if (editingInputRef.value.$el) {
        const input = editingInputRef.value.$el.querySelector('input')
        if (input) input.select()
      }
    }
  })
}

const handleEditBlur = () => {
  handleEditConfirm()
}

const handleEditConfirm = () => {
  if (editingCell.value) {
    const { rowIndex, colIndex } = editingCell.value
    const col = flatColumns.value[colIndex]
    const oldValue = props.data[rowIndex][col.prop]
    const newValue = editingValue.value
    
    props.data[rowIndex][col.prop] = newValue
    
    emit('cell-edit', {
      rowIndex,
      colIndex,
      row: props.data[rowIndex],
      column: col,
      oldValue,
      newValue
    })
    
    editingCell.value = null
    editingValue.value = ''
  }
}

const handleEditCancel = () => {
  editingCell.value = null
  editingValue.value = ''
}

const handleResizeStart = (e, cell) => {
  resizingCol.value = cell
  resizingStartX.value = e.clientX
  resizingStartWidth.value = cell.width
  
  document.addEventListener('mousemove', handleResizeMove)
  document.addEventListener('mouseup', handleResizeEnd)
}

const handleResizeMove = (e) => {
  if (!resizingCol.value) return
  const diff = e.clientX - resizingStartX.value
  const newWidth = Math.max(50, resizingStartWidth.value + diff)
  columnWidths.value[resizingCol.value.prop] = newWidth
}

const handleResizeEnd = () => {
  resizingCol.value = null
  document.removeEventListener('mousemove', handleResizeMove)
  document.removeEventListener('mouseup', handleResizeEnd)
}

const scrollToRow = (rowIndex) => {
  if (bodyRef.value) {
    bodyRef.value.scrollTop = rowIndex * props.rowHeight
  }
}

const scrollToColumn = (colIndex) => {
  if (bodyRef.value) {
    let left = 0
    for (let i = 0; i < colIndex; i++) {
      left += flatColumns.value[i].width
    }
    bodyRef.value.scrollLeft = left
  }
}

defineExpose({
  scrollToRow,
  scrollToColumn
})
</script>

<style scoped>
.virtual-table-container {
  position: relative;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
}

.virtual-table-header-wrapper {
  position: relative;
  overflow: hidden;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}

.virtual-table-header-scroll {
  overflow: hidden;
}

.virtual-table-header {
  table-layout: fixed;
  border-collapse: collapse;
  width: 100%;
}

.virtual-table-header-cell {
  position: relative;
  padding: 0 12px;
  font-weight: 500;
  color: #606266;
  background: #f5f7fa;
  border-right: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
  text-align: center;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: none;
  box-sizing: border-box;
}

.virtual-table-header-cell.is-fixed-left,
.virtual-table-header-cell.is-fixed-right {
  position: sticky;
  background: #f5f7fa;
  z-index: 10;
}

.virtual-table-header-cell.is-sortable {
  cursor: pointer;
}

.virtual-table-header-cell.is-sortable:hover {
  background: #eef0f2;
}

.virtual-table-header-cell .cell-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.virtual-table-header-cell .sort-icon {
  display: inline-flex;
  flex-direction: column;
  font-size: 12px;
  color: #909399;
}

.virtual-table-header-cell.is-sorted .sort-icon {
  color: #409eff;
}

.virtual-table-header-cell .resize-handle {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  cursor: col-resize;
  background: transparent;
  z-index: 20;
}

.virtual-table-header-cell .resize-handle:hover {
  background: #409eff;
}

.virtual-table-body {
  position: relative;
  overflow: auto;
}

.virtual-table-body-inner {
  position: relative;
}

.virtual-table-row {
  position: absolute;
  left: 0;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #ebeef5;
  box-sizing: border-box;
}

.virtual-table-row:hover {
  background: #f5f7fa;
}

.virtual-table-row-table {
  table-layout: fixed;
  border-collapse: collapse;
  width: 100%;
  height: 100%;
}

.virtual-table-cell {
  position: relative;
  padding: 0 12px;
  border-right: 1px solid #ebeef5;
  text-align: center;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-sizing: border-box;
  height: 100%;
}

.virtual-table-cell.is-fixed-left,
.virtual-table-cell.is-fixed-right {
  position: sticky;
  background: #fff;
  z-index: 10;
}

.virtual-table-cell.is-fixed-left::after,
.virtual-table-cell.is-fixed-right::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 0;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.15);
  z-index: 1;
}

.virtual-table-cell.is-fixed-left::after {
  right: -1px;
}

.virtual-table-cell.is-fixed-right::after {
  left: -1px;
}

.virtual-table-cell .cell-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.virtual-table-cell .cell-content span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.virtual-table-cell.is-editing {
  padding: 4px;
}

.virtual-table-cell.is-editing .cell-content {
  height: 100%;
}

.virtual-table-scrollbar-x {
  height: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  background: #f5f7fa;
}

.virtual-table-scrollbar-x::-webkit-scrollbar {
  height: 12px;
}

.virtual-table-scrollbar-x::-webkit-scrollbar-track {
  background: #f5f7fa;
}

.virtual-table-scrollbar-x::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 6px;
}

.virtual-table-scrollbar-x::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.virtual-table-body::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.virtual-table-body::-webkit-scrollbar-track {
  background: #f5f7fa;
}

.virtual-table-body::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 6px;
}

.virtual-table-body::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
