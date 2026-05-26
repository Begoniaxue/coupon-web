<template>
  <div class="spreadsheet-toolbar">
    <div class="toolbar-group">
      <button @click="$emit('undo')" :disabled="!canUndo" title="撤销 (Ctrl+Z)">
        <span class="icon">↶</span>
      </button>
      <button @click="$emit('redo')" :disabled="!canRedo" title="重做 (Ctrl+Y)">
        <span class="icon">↷</span>
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button @click="$emit('cut')" title="剪切 (Ctrl+X)">
        <span class="icon">✂️</span>
      </button>
      <button @click="$emit('copy')" title="复制 (Ctrl+C)">
        <span class="icon">📋</span>
      </button>
      <button @click="$emit('paste')" title="粘贴 (Ctrl+V)">
        <span class="icon">📌</span>
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <select :value="fontFamily" @change="(e) => $emit('fontFamily', (e.target as HTMLSelectElement).value)" title="字体">
        <option value="system-ui, -apple-system, sans-serif">默认</option>
        <option value="Arial, sans-serif">Arial</option>
        <option value="'Times New Roman', serif">Times New Roman</option>
        <option value="'Courier New', monospace">Courier New</option>
        <option value="'Microsoft YaHei', sans-serif">微软雅黑</option>
      </select>

      <select :value="fontSize" @change="(e) => $emit('fontSize', Number((e.target as HTMLSelectElement).value))" title="字号">
        <option :value="10">10</option>
        <option :value="11">11</option>
        <option :value="12">12</option>
        <option :value="13">13</option>
        <option :value="14">14</option>
        <option :value="16">16</option>
        <option :value="18">18</option>
        <option :value="20">20</option>
        <option :value="24">24</option>
      </select>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button @click="$emit('bold')" :class="{ active: bold }" title="加粗 (Ctrl+B)">
        <span class="icon" style="font-weight: bold;">B</span>
      </button>
      <button @click="$emit('italic')" :class="{ active: italic }" title="斜体 (Ctrl+I)">
        <span class="icon" style="font-style: italic;">I</span>
      </button>
      <button @click="$emit('underline')" :class="{ active: underline }" title="下划线 (Ctrl+U)">
        <span class="icon" style="text-decoration: underline;">U</span>
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <label class="color-picker" title="字体颜色">
        <span class="icon">A</span>
        <input type="color" :value="color" @input="(e) => $emit('color', (e.target as HTMLInputElement).value)" />
      </label>
      <label class="color-picker" title="背景颜色">
        <span class="icon bucket">🪣</span>
        <input type="color" :value="backgroundColor" @input="(e) => $emit('backgroundColor', (e.target as HTMLInputElement).value)" />
      </label>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button @click="$emit('alignLeft')" :class="{ active: textAlign === 'left' }" title="左对齐">
        <span class="icon">⬅</span>
      </button>
      <button @click="$emit('alignCenter')" :class="{ active: textAlign === 'center' }" title="居中对齐">
        <span class="icon">↔</span>
      </button>
      <button @click="$emit('alignRight')" :class="{ active: textAlign === 'right' }" title="右对齐">
        <span class="icon">➡</span>
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <select :value="numberFormat" @change="(e) => $emit('numberFormat', (e.target as HTMLSelectElement).value)" title="数字格式">
        <option value="general">常规</option>
        <option value="number">数字</option>
        <option value="currency">货币</option>
        <option value="percentage">百分比</option>
        <option value="date">日期</option>
      </select>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button @click="$emit('merge')" title="合并单元格">
        <span class="icon">⬌</span>
      </button>
      <button @click="$emit('unmerge')" title="拆分单元格">
        <span class="icon">⬍</span>
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button @click="$emit('freezeRow')" :class="{ active: frozenRows > 0 }" title="冻结首行">
        <span class="icon">🔒</span>行
      </button>
      <button @click="$emit('freezeCol')" :class="{ active: frozenCols > 0 }" title="冻结首列">
        <span class="icon">🔒</span>列
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button @click="$emit('sortAsc')" title="升序排序">
        <span class="icon">↑</span>A-Z
      </button>
      <button @click="$emit('sortDesc')" title="降序排序">
        <span class="icon">↓</span>Z-A
      </button>
      <button @click="$emit('filter')" :class="{ active: hasFilter }" title="筛选">
        <span class="icon">🔍</span>
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button @click="$emit('addChart', 'bar')" title="插入柱状图">
        <span class="icon">📊</span>
      </button>
      <button @click="$emit('addChart', 'line')" title="插入折线图">
        <span class="icon">📈</span>
      </button>
      <button @click="$emit('addChart', 'pie')" title="插入饼图">
        <span class="icon">🥧</span>
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button @click="$emit('exportCsv')" title="导出CSV">
        <span class="icon">📄</span> CSV
      </button>
      <button @click="$emit('exportExcel')" title="导出Excel">
        <span class="icon">📗</span> Excel
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button @click="$emit('clear')" title="清除内容">
        <span class="icon">🗑️</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  canUndo: boolean
  canRedo: boolean
  fontFamily: string
  fontSize: number
  bold: boolean
  italic: boolean
  underline: boolean
  color: string
  backgroundColor: string
  textAlign: string
  numberFormat: string
  frozenRows: number
  frozenCols: number
  hasFilter: boolean
}>()

defineEmits<{
  (e: 'undo'): void
  (e: 'redo'): void
  (e: 'cut'): void
  (e: 'copy'): void
  (e: 'paste'): void
  (e: 'fontFamily', value: string): void
  (e: 'fontSize', value: number): void
  (e: 'bold'): void
  (e: 'italic'): void
  (e: 'underline'): void
  (e: 'color', value: string): void
  (e: 'backgroundColor', value: string): void
  (e: 'alignLeft'): void
  (e: 'alignCenter'): void
  (e: 'alignRight'): void
  (e: 'numberFormat', value: string): void
  (e: 'merge'): void
  (e: 'unmerge'): void
  (e: 'freezeRow'): void
  (e: 'freezeCol'): void
  (e: 'sortAsc'): void
  (e: 'sortDesc'): void
  (e: 'filter'): void
  (e: 'addChart', type: string): void
  (e: 'exportCsv'): void
  (e: 'exportExcel'): void
  (e: 'clear'): void
}>()
</script>

<style scoped>
.spreadsheet-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #d1d5db;
  margin: 0 4px;
}

button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #374151;
  transition: all 0.15s;
}

button:hover:not(:disabled) {
  background: #e5e7eb;
  border-color: #d1d5db;
}

button:active:not(:disabled) {
  background: #d1d5db;
}

button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

button.active {
  background: #dbeafe;
  border-color: #93c5fd;
  color: #1d4ed8;
}

.icon {
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

select {
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 13px;
  background: white;
  cursor: pointer;
}

select:hover {
  border-color: #9ca3af;
}

.color-picker {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
}

.color-picker:hover {
  background: #e5e7eb;
}

.color-picker input[type="color"] {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.icon.bucket {
  font-size: 16px;
}
</style>
