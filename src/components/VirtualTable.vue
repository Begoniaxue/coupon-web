<template>
  <div class="virtual-table-container" ref="containerRef">
    <div class="table-wrapper" ref="tableWrapper">
      <div class="table-header-wrapper" ref="headerWrapper">
        <div class="frozen-header-left" v-if="frozenLeftColumns > 0" :style="frozenHeaderLeftStyle">
          <div class="frozen-header-scroller">
            <div
              v-for="cell in frozenLeftHeaderCells"
              :key="'frozen-' + cell.prop + '-' + cell.depth + '-' + cell.startLeafIndex"
              class="table-header-cell frozen-left"
              :class="getHeaderCellClass(cell)"
              :style="getFrozenHeaderCellStyle(cell)"
              @click="handleHeaderClick(cell)"
              @mousedown="startResize($event, cell)"
            >
              <span class="header-content">
                {{ cell.title }}
                <span v-if="cell.sortable && !cell.hasChildren" class="sort-indicator">
                  <el-icon v-if="sortColumn === cell.prop && sortOrder === 'asc'" class="active">
                    <Sort />
                  </el-icon>
                  <el-icon v-else-if="sortColumn === cell.prop && sortOrder === 'desc'" class="active desc">
                    <Sort />
                  </el-icon>
                  <el-icon v-else class="inactive">
                    <Sort />
                  </el-icon>
                </span>
              </span>
              <div
                v-if="cell.resizable !== false && !cell.hasChildren"
                class="resize-handle"
                @mousedown.stop="startResize($event, cell)"
              ></div>
            </div>
          </div>
        </div>

        <div class="main-header-container" ref="mainHeaderRef">
          <div class="main-header-scroller" :style="mainHeaderScrollerStyle">
            <div
              v-for="cell in mainHeaderCells"
              :key="'main-' + cell.prop + '-' + cell.depth + '-' + cell.startLeafIndex"
              class="table-header-cell"
              :class="getHeaderCellClass(cell)"
              :style="getMainHeaderCellStyle(cell)"
              @click="handleHeaderClick(cell)"
              @mousedown="startResize($event, cell)"
            >
              <span class="header-content">
                {{ cell.title }}
                <span v-if="cell.sortable && !cell.hasChildren" class="sort-indicator">
                  <el-icon v-if="sortColumn === cell.prop && sortOrder === 'asc'" class="active">
                    <Sort />
                  </el-icon>
                  <el-icon v-else-if="sortColumn === cell.prop && sortOrder === 'desc'" class="active desc">
                    <Sort />
                  </el-icon>
                  <el-icon v-else class="inactive">
                    <Sort />
                  </el-icon>
                </span>
              </span>
              <div
                v-if="cell.resizable !== false && !cell.hasChildren"
                class="resize-handle"
                @mousedown.stop="startResize($event, cell)"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div class="table-body-wrapper" ref="bodyWrapper" @scroll="handleBodyScroll" @wheel="handleWheel">
        <div class="body-spacer" :style="bodySpacerStyle"></div>

        <div class="frozen-body-left" v-if="frozenLeftColumns > 0" :style="frozenBodyLeftStyle">
          <div class="frozen-body-scroller" :style="frozenBodyScrollerStyle">
            <div
              v-for="(rowData, rowIndex) in visibleRows"
              :key="'frozen-row-' + getRowKey(rowData, startRowIndex + rowIndex)"
              class="table-row"
              :class="{ 'row-selected': selectedCell?.row === startRowIndex + rowIndex }"
              :style="{ height: rowHeight + 'px' }"
              @click="handleRowClick(startRowIndex + rowIndex, rowData)"
            >
              <div
                v-for="(cell, cellIndex) in frozenLeftVisibleCells(rowData)"
                :key="'frozen-cell-' + cellIndex"
                :class="getCellClass(cellIndex, startRowIndex + rowIndex, cell)"
                :style="getFrozenCellStyle(cell)"
                @click.stop="handleCellClick(startRowIndex + rowIndex, cell.column, cell.value)"
                @dblclick="handleCellDblClick(startRowIndex + rowIndex, cell.column)"
              >
                <template v-if="isEditing(startRowIndex + rowIndex, cell.column.prop)">
                  <el-input
                    ref="editingInput"
                    v-model="editingValue"
                    size="small"
                    @blur="handleEditBlur(startRowIndex + rowIndex, cell.column.prop)"
                    @keyup.enter="handleEditBlur(startRowIndex + rowIndex, cell.column.prop)"
                    @keyup.esc="cancelEdit"
                  />
                </template>
                <template v-else>
                  <span class="cell-content">{{ cell.value }}</span>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div class="main-body-scroller" :style="mainBodyScrollerStyle">
          <div
            v-for="(rowData, rowIndex) in visibleRows"
            :key="'main-row-' + getRowKey(rowData, startRowIndex + rowIndex)"
            class="table-row"
            :class="{ 'row-selected': selectedCell?.row === startRowIndex + rowIndex }"
            :style="{ height: rowHeight + 'px' }"
            @click="handleRowClick(startRowIndex + rowIndex, rowData)"
          >
            <div
              v-for="(cell, cellIndex) in mainVisibleCells(rowData)"
              :key="'main-cell-' + cellIndex"
              :class="getCellClass(cellIndex, startRowIndex + rowIndex, cell)"
              :style="getMainCellStyle(cell)"
              @click.stop="handleCellClick(startRowIndex + rowIndex, cell.column, cell.value)"
              @dblclick="handleCellDblClick(startRowIndex + rowIndex, cell.column)"
            >
              <template v-if="isEditing(startRowIndex + rowIndex, cell.column.prop)">
                <el-input
                  ref="editingInput"
                  v-model="editingValue"
                  size="small"
                  @blur="handleEditBlur(startRowIndex + rowIndex, cell.column.prop)"
                  @keyup.enter="handleEditBlur(startRowIndex + rowIndex, cell.column.prop)"
                  @keyup.esc="cancelEdit"
                />
              </template>
              <template v-else>
                <span class="cell-content">{{ cell.value }}</span>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Sort } from '@element-plus/icons-vue'

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
    default: 40
  },
  headerRowHeight: {
    type: Number,
    default: 36
  },
  defaultColumnWidth: {
    type: Number,
    default: 120
  },
  frozenLeftColumns: {
    type: Number,
    default: 3
  },
  frozenRightColumns: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['cell-click', 'cell-edit', 'sort-change'])

const containerRef = ref(null)
const tableWrapper = ref(null)
const headerWrapper = ref(null)
const mainHeaderRef = ref(null)
const bodyWrapper = ref(null)
const editingInput = ref(null)

const scrollTop = ref(0)
const scrollLeft = ref(0)
const containerHeight = ref(0)
const containerWidth = ref(0)
const columnWidths = ref({})
const editingCell = ref(null)
const editingValue = ref('')
const selectedCell = ref(null)

const sortColumn = ref('')
const sortOrder = ref('')

let rafPending = false

const totalHeight = computed(() => props.data.length * props.rowHeight)

const flattenedColumns = computed(() => {
  const cols = []
  const flatten = (columns, level = 0) => {
    columns.forEach(col => {
      if (col.children) {
        flatten(col.children, level + 1)
      } else {
        cols.push({ ...col, level })
      }
    })
  }
  flatten(props.columns)
  return cols
})

const totalWidth = computed(() => {
  return flattenedColumns.value.reduce((sum, col) => {
    const w = columnWidths.value[col.prop] || col.width || props.defaultColumnWidth
    return sum + w
  }, 0)
})

const headerDepth = computed(() => {
  const getMaxDepth = (columns, depth = 1) => {
    let maxDepth = depth
    columns.forEach(col => {
      if (col.children) {
        const childDepth = getMaxDepth(col.children, depth + 1)
        maxDepth = Math.max(maxDepth, childDepth)
      }
    })
    return maxDepth
  }
  return getMaxDepth(props.columns)
})

const totalHeaderHeight = computed(() => headerDepth.value * props.headerRowHeight)

function getLeafCount(columns) {
  let count = 0
  columns.forEach(col => {
    if (col.children) {
      count += getLeafCount(col.children)
    } else {
      count++
    }
  })
  return count
}

function getColumnWidthByIndex(colIndex) {
  const col = flattenedColumns.value[colIndex]
  if (!col) return props.defaultColumnWidth
  return columnWidths.value[col.prop] || col.width || props.defaultColumnWidth
}

function getColumnLeftOffset(colIndex) {
  let width = 0
  for (let i = 0; i < colIndex; i++) {
    width += getColumnWidthByIndex(i)
  }
  return width
}

function getColumnsTotalWidth(startIndex, endIndex) {
  let width = 0
  for (let i = startIndex; i <= endIndex && i < flattenedColumns.value.length; i++) {
    width += getColumnWidthByIndex(i)
  }
  return width
}

const flatHeaderCells = computed(() => {
  const cells = []
  const depth = headerDepth.value

  const addCell = (col, currentDepth, startLeafIndex) => {
    const hasChildren = col.children && col.children.length > 0
    const leafCount = hasChildren ? getLeafCount(col.children) : 1
    const endLeafIndex = startLeafIndex + leafCount - 1

    const cellWidth = getColumnsTotalWidth(startLeafIndex, endLeafIndex)
    const cellLeft = getColumnLeftOffset(startLeafIndex)
    const cellTop = currentDepth * props.headerRowHeight
    const rowSpan = hasChildren ? 1 : (depth - currentDepth)
    const cellHeight = rowSpan * props.headerRowHeight

    const cellData = {
      title: col.title,
      prop: col.prop,
      sortable: col.sortable,
      editable: col.editable,
      type: col.type,
      resizable: col.resizable,
      hasChildren,
      leafCount,
      startLeafIndex,
      endLeafIndex,
      width: cellWidth,
      left: cellLeft,
      top: cellTop,
      height: cellHeight,
      depth: currentDepth,
      isLeaf: !hasChildren,
      rowSpan
    }

    cells.push(cellData)

    if (hasChildren) {
      let currentLeafIndex = startLeafIndex
      col.children.forEach(child => {
        const childLeafCount = child.children && child.children.length > 0 ? getLeafCount(child.children) : 1
        addCell(child, currentDepth + 1, currentLeafIndex)
        currentLeafIndex += childLeafCount
      })
    }
  }

  let currentLeafIndex = 0
  props.columns.forEach(col => {
    const leafCount = col.children && col.children.length > 0 ? getLeafCount(col.children) : 1
    addCell(col, 0, currentLeafIndex)
    currentLeafIndex += leafCount
  })

  return cells
})

const frozenLeftWidth = computed(() => {
  let width = 0
  for (let i = 0; i < props.frozenLeftColumns && i < flattenedColumns.value.length; i++) {
    width += getColumnWidthByIndex(i)
  }
  return width
})

const mainBodyWidth = computed(() => {
  return totalWidth.value - frozenLeftWidth.value
})

const frozenLeftHeaderCells = computed(() => {
  return flatHeaderCells.value.filter(cell => {
    return cell.startLeafIndex < props.frozenLeftColumns && cell.endLeafIndex < props.frozenLeftColumns
  })
})

const mainHeaderCells = computed(() => {
  return flatHeaderCells.value.filter(cell => {
    return cell.startLeafIndex >= props.frozenLeftColumns
  })
})

const frozenHeaderLeftStyle = computed(() => ({
  width: frozenLeftWidth.value + 'px',
  height: totalHeaderHeight.value + 'px',
  position: 'absolute',
  left: 0,
  top: 0,
  zIndex: 100,
  overflow: 'hidden',
  backgroundColor: '#e8f4ff'
}))

const mainHeaderScrollerStyle = computed(() => ({
  width: mainBodyWidth.value + 'px',
  height: totalHeaderHeight.value + 'px',
  position: 'relative',
  transform: 'translateX(' + (-scrollLeft.value) + 'px)'
}))

function getFrozenHeaderCellStyle(cell) {
  return {
    position: 'absolute',
    top: cell.top + 'px',
    left: cell.left + 'px',
    width: cell.width + 'px',
    height: cell.height + 'px',
    zIndex: cell.isLeaf ? 50 : 60,
    boxSizing: 'border-box',
    display: 'flex',
    backgroundColor: cell.isLeaf ? '#f0f7ff' : '#e8f4ff',
    borderRight: cell.endLeafIndex === props.frozenLeftColumns - 1 ? '2px solid #dcdfe6' : '1px solid #ebeef5'
  }
}

function getMainHeaderCellStyle(cell) {
  const relativeLeft = cell.left - frozenLeftWidth.value
  return {
    position: 'absolute',
    top: cell.top + 'px',
    left: relativeLeft + 'px',
    width: cell.width + 'px',
    height: cell.height + 'px',
    zIndex: cell.isLeaf ? 20 : 30,
    boxSizing: 'border-box',
    display: 'flex'
  }
}

function getHeaderCellClass(cell) {
  const classes = []

  if (cell.sortable && cell.isLeaf) classes.push('sortable')
  if (cell.isLeaf) classes.push('is-leaf')
  if (!cell.isLeaf) classes.push('is-parent')
  if (cell.rowSpan > 1) classes.push('rowspan')

  return classes
}

const visibleStartRow = computed(() => Math.max(0, Math.floor(scrollTop.value / props.rowHeight) - 1))
const visibleEndRow = computed(() => {
  const height = containerHeight.value || 400
  return Math.min(
    Math.ceil((scrollTop.value + height) / props.rowHeight) + 1,
    props.data.length
  )
})

const startRowIndex = computed(() => visibleStartRow.value)
const visibleRows = computed(() => {
  return props.data.slice(visibleStartRow.value, visibleEndRow.value)
})

const bodySpacerStyle = computed(() => ({
  height: totalHeight.value + 'px',
  width: mainBodyWidth.value + 'px',
  position: 'absolute',
  left: frozenLeftWidth.value + 'px',
  top: 0,
  pointerEvents: 'none'
}))

const frozenBodyLeftStyle = computed(() => ({
  width: frozenLeftWidth.value + 'px',
  height: '100%',
  position: 'absolute',
  left: 0,
  top: 0,
  zIndex: 50,
  overflow: 'hidden',
  backgroundColor: '#fff',
  pointerEvents: 'auto',
  transform: 'translateX(' + scrollLeft.value + 'px)'
}))

const frozenBodyScrollerStyle = computed(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  transform: 'translateY(' + (visibleStartRow.value * props.rowHeight) + 'px)'
}))

const mainBodyScrollerStyle = computed(() => ({
  position: 'absolute',
  top: 0,
  left: frozenLeftWidth.value + 'px',
  transform: 'translateY(' + (visibleStartRow.value * props.rowHeight) + 'px) translateX(' + (-scrollLeft.value) + 'px)',
  pointerEvents: 'auto'
}))

const frozenLeftColumnsList = computed(() => {
  const cols = []
  for (let i = 0; i < props.frozenLeftColumns && i < flattenedColumns.value.length; i++) {
    const col = flattenedColumns.value[i]
    cols.push({
      ...col,
      visibleIndex: i,
      frozen: 'left',
      originalIndex: i,
      left: getColumnLeftOffset(i),
      width: getColumnWidthByIndex(i)
    })
  }
  return cols
})

const mainColumnsList = computed(() => {
  const cols = []
  for (let i = props.frozenLeftColumns; i < flattenedColumns.value.length; i++) {
    const col = flattenedColumns.value[i]
    cols.push({
      ...col,
      visibleIndex: i - props.frozenLeftColumns,
      frozen: null,
      originalIndex: i,
      left: getColumnLeftOffset(i),
      width: getColumnWidthByIndex(i)
    })
  }
  return cols
})

function frozenLeftVisibleCells(rowData) {
  return frozenLeftColumnsList.value.map(col => ({
    column: col,
    value: formatCellValue(rowData, col)
  }))
}

function mainVisibleCells(rowData) {
  return mainColumnsList.value.map(col => ({
    column: col,
    value: formatCellValue(rowData, col)
  }))
}

function formatCellValue(rowData, col) {
  if (col.formatter) {
    return col.formatter(rowData, col)
  }
  return rowData[col.prop] !== undefined ? rowData[col.prop] : ''
}

function getRowKey(rowData, index) {
  return rowData.id || index
}

function getFrozenCellStyle(cell) {
  const col = cell.column
  const isLastFrozen = col.originalIndex === props.frozenLeftColumns - 1
  return {
    width: col.width + 'px',
    minWidth: col.width + 'px',
    borderRight: isLastFrozen ? '2px solid #dcdfe6' : '1px solid #ebeef5'
  }
}

function getMainCellStyle(cell) {
  const col = cell.column
  return {
    width: col.width + 'px',
    minWidth: col.width + 'px'
  }
}

function getCellClass(cellIndex, rowIndex, cell) {
  const classes = ['table-cell']
  const column = cell.column

  if (column?.frozen === 'left') classes.push('frozen-left')
  if (column?.frozen === 'right') classes.push('frozen-right')

  if (selectedCell.value?.row === rowIndex && selectedCell.value?.prop === column?.prop) {
    classes.push('cell-selected')
  }

  if (isEditing(rowIndex, column?.prop)) {
    classes.push('editing')
  }

  return classes
}

function handleBodyScroll() {
  scrollTop.value = bodyWrapper.value.scrollTop
  
  if (rafPending) return
  rafPending = true
  requestAnimationFrame(() => {
    scrollLeft.value = bodyWrapper.value.scrollLeft
    rafPending = false
  })
}

function handleWheel(e) {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    return
  }
}

function handleHeaderClick(cell) {
  if (!cell.sortable || !cell.isLeaf) return

  if (sortColumn.value === cell.prop) {
    if (sortOrder.value === 'asc') {
      sortOrder.value = 'desc'
    } else if (sortOrder.value === 'desc') {
      sortColumn.value = ''
      sortOrder.value = ''
    } else {
      sortOrder.value = 'asc'
    }
  } else {
    sortColumn.value = cell.prop
    sortOrder.value = 'asc'
  }

  emit('sort-change', {
    prop: sortColumn.value,
    order: sortOrder.value
  })
}

function handleRowClick(rowIndex, rowData) {
  emit('cell-click', {
    row: rowIndex,
    rowData,
    column: null,
    value: null
  })
}

function handleCellClick(rowIndex, column, value) {
  selectedCell.value = {
    row: rowIndex,
    prop: column.prop,
    column
  }

  emit('cell-click', {
    row: rowIndex,
    rowData: props.data[rowIndex],
    column,
    value
  })
}

function handleCellDblClick(rowIndex, column) {
  if (!column.editable) return

  const rowData = props.data[rowIndex]
  editingCell.value = {
    row: rowIndex,
    prop: column.prop
  }
  editingValue.value = String(rowData[column.prop] !== undefined ? rowData[column.prop] : '')

  nextTick(() => {
    if (editingInput.value && editingInput.value.length > 0) {
      const input = editingInput.value[0]
      if (input && input.focus) {
        input.focus()
        input.select()
      }
    }
  })
}

function isEditing(rowIndex, prop) {
  return editingCell.value &&
         editingCell.value.row === rowIndex &&
         editingCell.value.prop === prop
}

function handleEditBlur(rowIndex, prop) {
  if (!editingCell.value) return

  const rowData = props.data[rowIndex]
  const oldValue = rowData[prop]
  let newValue = editingValue.value

  const column = flattenedColumns.value.find(c => c.prop === prop)
  if (column?.type === 'number') {
    newValue = Number(newValue) || 0
  }

  if (oldValue !== newValue) {
    emit('cell-edit', {
      row: rowIndex,
      rowData,
      prop,
      oldValue,
      newValue
    })
  }

  editingCell.value = null
  editingValue.value = ''
}

function cancelEdit() {
  editingCell.value = null
  editingValue.value = ''
}

let isResizing = false
let resizeCol = null
let startX = 0
let startWidth = 0

function startResize(e, cell) {
  if (!cell.isLeaf) return

  e.preventDefault()
  e.stopPropagation()

  isResizing = true
  resizeCol = cell
  startX = e.clientX
  startWidth = cell.width

  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

function handleResize(e) {
  if (!isResizing || !resizeCol) return

  const delta = e.clientX - startX
  const newWidth = Math.max(50, startWidth + delta)

  if (resizeCol.prop) {
    columnWidths.value[resizeCol.prop] = newWidth
  }
}

function stopResize() {
  isResizing = false
  resizeCol = null
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

function initColumnWidths() {
  flattenedColumns.value.forEach(col => {
    if (!columnWidths.value[col.prop] && col.width) {
      columnWidths.value[col.prop] = col.width
    }
  })
}

function updateContainerSize() {
  if (bodyWrapper.value) {
    containerHeight.value = bodyWrapper.value.clientHeight
    containerWidth.value = bodyWrapper.value.clientWidth
  }
}

watch(() => props.columns, () => {
  initColumnWidths()
}, { immediate: true, deep: true })

watch(() => props.data, () => {
  nextTick(() => {
    updateContainerSize()
  })
  if (scrollTop.value > props.data.length * props.rowHeight) {
    scrollTop.value = 0
    if (bodyWrapper.value) {
      bodyWrapper.value.scrollTop = 0
    }
  }
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    updateContainerSize()
  })
  window.addEventListener('resize', updateContainerSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerSize)
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped>
.virtual-table-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  position: relative;
}

.table-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.table-header-wrapper {
  flex-shrink: 0;
  position: relative;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  z-index: 2;
  height: v-bind('totalHeaderHeight + "px"');
  overflow: hidden;
}

.main-header-container {
  margin-left: v-bind('frozenLeftColumns > 0 ? frozenLeftWidth + "px" : "0px"');
  height: 100%;
  overflow: hidden;
}

.main-header-scroller {
  will-change: transform;
}

.table-header-cell {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  background-color: #f5f7fa;
  border-right: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
  font-weight: 500;
  color: #303133;
  font-size: 14px;
  box-sizing: border-box;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: none;
  transition: background-color 0.2s;
}

.table-header-cell.is-leaf {
  background-color: #fafafa;
}

.table-header-cell.is-parent {
  background-color: #e8f4ff;
  border-bottom: 2px solid #409eff;
}

.table-header-cell.sortable {
  cursor: pointer;
}

.table-header-cell.sortable:hover {
  background-color: #eef1f6;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
}

.sort-indicator {
  display: flex;
  align-items: center;
}

.sort-indicator .inactive {
  color: #c0c4cc;
  opacity: 0.5;
}

.sort-indicator .active {
  color: #409eff;
}

.sort-indicator .active.desc {
  transform: rotate(180deg);
}

.resize-handle {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  cursor: col-resize;
  background-color: transparent;
  z-index: 20;
}

.resize-handle:hover {
  background-color: #409eff;
  opacity: 0.5;
}

.table-body-wrapper {
  flex: 1;
  overflow: auto;
  position: relative;
  background-color: #fff;
}

.body-spacer {
  visibility: hidden;
}

.frozen-body-scroller {
  will-change: transform;
}

.main-body-scroller {
  will-change: transform;
}

.table-row {
  display: flex;
  box-sizing: border-box;
  border-bottom: 1px solid #ebeef5;
  cursor: default;
  position: relative;
  width: 100%;
  background-color: inherit;
}

.table-row:hover {
  background-color: #f5f7fa;
}

.table-row.row-selected {
  background-color: #ecf5ff;
}

.table-cell {
  padding: 8px 12px;
  border-right: 1px solid #ebeef5;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 14px;
  color: #606266;
  flex-shrink: 0;
  position: relative;
  background-color: inherit;
}

.frozen-body-left .table-cell {
  background-color: #fff;
}

.table-row:hover .frozen-body-left .table-cell {
  background-color: #f5f7fa;
}

.table-cell.frozen-left {
  background-color: inherit;
}

.table-cell.cell-selected {
  background-color: #d9ecff !important;
  outline: 2px solid #409eff;
  outline-offset: -2px;
  z-index: 10;
}

.table-cell.editing {
  padding: 2px;
}

.table-cell.editing :deep(.el-input) {
  width: 100%;
}

.table-cell.editing :deep(.el-input__wrapper) {
  box-shadow: none;
  padding: 2px 8px;
}

.cell-content {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 6px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 6px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
