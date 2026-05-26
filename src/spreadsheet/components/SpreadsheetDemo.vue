<template>
  <div class="demo-page">
    <div class="demo-header">
      <h1>📊 类 Excel 在线表格演示</h1>
      <p>基于 Vue 3 + TypeScript + Canvas + WebWorker 技术构建</p>
    </div>
    
    <div class="demo-content">
      <div class="feature-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.name }}
        </button>
      </div>
      
      <div v-if="activeTab === 'demo'" class="spreadsheet-wrapper">
        <Spreadsheet ref="spreadsheetRef" />
      </div>
      
      <div v-else-if="activeTab === 'features'" class="features-grid">
        <div v-for="feature in features" :key="feature.title" class="feature-card">
          <div class="feature-icon">{{ feature.icon }}</div>
          <h3>{{ feature.title }}</h3>
          <ul>
            <li v-for="item in feature.items" :key="item">{{ item }}</li>
          </ul>
        </div>
      </div>
      
      <div v-else-if="activeTab === 'api'" class="api-docs">
        <h2>API 参考</h2>
        <div class="api-section">
          <h3>公式函数</h3>
          <table>
            <thead>
              <tr><th>函数</th><th>说明</th><th>示例</th></tr>
            </thead>
            <tbody>
              <tr v-for="func in formulaFunctions" :key="func.name">
                <td><code>{{ func.name }}</code></td>
                <td>{{ func.desc }}</td>
                <td><code>{{ func.example }}</code></td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="api-section">
          <h3>快捷键</h3>
          <table>
            <thead>
              <tr><th>快捷键</th><th>功能</th></tr>
            </thead>
            <tbody>
              <tr v-for="key in shortcuts" :key="key.keys">
                <td><kbd>{{ key.keys }}</kbd></td>
                <td>{{ key.action }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div v-else-if="activeTab === 'performance'" class="performance-test">
        <h2>性能测试</h2>
        <p>测试 WebWorker 在大数据量下的计算性能</p>
        
        <div class="test-controls">
          <button @click="generateTestData(100)">生成 100 单元格</button>
          <button @click="generateTestData(1000)">生成 1000 单元格</button>
          <button @click="generateTestData(10000)">生成 10000 单元格</button>
          <button @click="generateTestData(100000)">生成 100000 单元格</button>
        </div>
        
        <div v-if="testResult" class="test-result">
          <p>✅ 生成完成：{{ testResult.cellCount }} 个单元格</p>
          <p>⏱️ 耗时：{{ testResult.duration }}ms</p>
          <p>📊 公式计算：{{ testResult.formulaCount }} 个公式</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Spreadsheet from './Spreadsheet.vue'
import { useSpreadsheetStore } from '../store/spreadsheetStore'
import { CELL_KEY } from '../utils/cellUtils'

const spreadsheetRef = ref<InstanceType<typeof Spreadsheet> | null>(null)
const store = useSpreadsheetStore()

const activeTab = ref('demo')

const tabs = [
  { id: 'demo', name: '📊 表格演示' },
  { id: 'features', name: '✨ 功能特性' },
  { id: 'api', name: '📚 API 文档' },
  { id: 'performance', name: '⚡ 性能测试' }
]

const features = [
  {
    icon: '📐',
    title: '基础网格',
    items: [
      '无限行列滚动',
      'Canvas 虚拟渲染',
      '单元格选中/多选',
      '拖拽填充柄',
      '合并/拆分单元格'
    ]
  },
  {
    icon: '🎨',
    title: '格式设置',
    items: [
      '字体、字号、颜色',
      '加粗、斜体、下划线',
      '文本对齐方式',
      '单元格背景色',
      '数字格式（货币/百分比/日期）'
    ]
  },
  {
    icon: '🔢',
    title: '公式计算',
    items: [
      'SUM/AVG/COUNT/MAX/MIN',
      'IF/VLOOKUP 逻辑函数',
      '单元格引用（A1/B2）',
      '自动计算',
      '循环引用检测'
    ]
  },
  {
    icon: '🚀',
    title: '高级功能',
    items: [
      '数据筛选',
      '排序（升序/降序）',
      '冻结首行/首列',
      '条件格式',
      '插入图表（柱状/折线/饼图）'
    ]
  },
  {
    icon: '⚙️',
    title: '操作功能',
    items: [
      '复制/剪切/粘贴',
      '系统剪贴板支持',
      '撤销/重做',
      '批量操作',
      '快捷键支持'
    ]
  },
  {
    icon: '📤',
    title: '导出功能',
    items: [
      '导出 CSV 格式',
      '导出 Excel (xlsx) 格式',
      '保留样式信息',
      '支持大文件导出'
    ]
  },
  {
    icon: '⚡',
    title: '性能优化',
    items: [
      'WebWorker 计算公式',
      '不阻塞主线程',
      '虚拟滚动渲染',
      '支持 10 万+ 单元格',
      '流畅的交互体验'
    ]
  },
  {
    icon: '🔧',
    title: '技术架构',
    items: [
      'Vue 3 Composition API',
      'TypeScript 类型安全',
      'Canvas 高性能渲染',
      'Pinia 状态管理',
      'WebWorker 后台计算'
    ]
  }
]

const formulaFunctions = [
  { name: 'SUM(range)', desc: '求和', example: '=SUM(A1:A10)' },
  { name: 'AVG(range)', desc: '平均值', example: '=AVG(B1:B5)' },
  { name: 'COUNT(range)', desc: '计数', example: '=COUNT(C1:C20)' },
  { name: 'MAX(range)', desc: '最大值', example: '=MAX(D1:D10)' },
  { name: 'MIN(range)', desc: '最小值', example: '=MIN(E1:E10)' },
  { name: 'IF(cond, a, b)', desc: '条件判断', example: '=IF(A1>10, "大", "小")' },
  { name: 'VLOOKUP(val, range, col, match)', desc: '查找', example: '=VLOOKUP(A1, B1:C10, 2, 0)' },
  { name: 'CONCAT(a, b, ...)', desc: '连接字符串', example: '=CONCAT(A1, " ", B1)' },
  { name: 'ROUND(num, dec)', desc: '四舍五入', example: '=ROUND(A1, 2)' },
  { name: 'ABS(num)', desc: '绝对值', example: '=ABS(A1)' },
  { name: 'TODAY()', desc: '当前日期', example: '=TODAY()' },
  { name: 'NOW()', desc: '当前日期时间', example: '=NOW()' }
]

const shortcuts = [
  { keys: 'Ctrl + Z', action: '撤销' },
  { keys: 'Ctrl + Y', action: '重做' },
  { keys: 'Ctrl + C', action: '复制' },
  { keys: 'Ctrl + X', action: '剪切' },
  { keys: 'Ctrl + V', action: '粘贴' },
  { keys: 'Ctrl + B', action: '加粗' },
  { keys: 'Ctrl + I', action: '斜体' },
  { keys: 'Ctrl + U', action: '下划线' },
  { keys: 'Enter / F2', action: '编辑单元格' },
  { keys: 'Delete / Backspace', action: '清除内容' },
  { keys: '方向键', action: '移动选中' },
  { keys: 'Shift + 方向键', action: '扩展选择' }
]

const testResult = ref<any>(null)

const generateTestData = async (count: number) => {
  if (!spreadsheetRef.value) return
  
  const startTime = performance.now()
  let formulaCount = 0
  
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / 10)
    const col = i % 10
    
    if (Math.random() > 0.7 && row > 0) {
      const formula = `=SUM(A${row}:E${row})`
      store.setCell(row, col, { formula, value: 0 }, false)
      formulaCount++
    } else {
      const value = Math.floor(Math.random() * 1000)
      store.setCell(row, col, { value }, false)
    }
  }
  
  const endTime = performance.now()
  
  testResult.value = {
    cellCount: count,
    formulaCount,
    duration: Math.round(endTime - startTime)
  }
  
  spreadsheetRef.value.render()
}

const loadDemoData = () => {
  const sampleData = [
    ['产品名称', 'Q1 销量', 'Q2 销量', 'Q3 销量', 'Q4 销量', '年度总计', '增长率'],
    ['产品A', 1200, 1350, 1500, 1680, '=SUM(B2:E2)', '=F2/B2-1'],
    ['产品B', 890, 920, 1050, 1180, '=SUM(B3:E3)', '=F3/B3-1'],
    ['产品C', 2100, 2280, 2450, 2680, '=SUM(B4:E4)', '=F4/B4-1'],
    ['产品D', 560, 620, 710, 800, '=SUM(B5:E5)', '=F5/B5-1'],
    ['产品E', 1800, 1950, 2100, 2350, '=SUM(B6:E6)', '=F6/B6-1'],
    ['合计', '=SUM(B2:B6)', '=SUM(C2:C6)', '=SUM(D2:D6)', '=SUM(E2:E6)', '=SUM(F2:F6)', '=F7/B7-1'],
    ['平均', '=AVG(B2:B6)', '=AVG(C2:C6)', '=AVG(D2:D6)', '=AVG(E2:E6)', '=AVG(F2:F6)', ''],
    ['最高', '=MAX(B2:B6)', '=MAX(C2:C6)', '=MAX(D2:D6)', '=MAX(E2:E6)', '=MAX(F2:F6)', ''],
    ['最低', '=MIN(B2:B6)', '=MIN(C2:C6)', '=MIN(D2:D6)', '=MIN(E2:E6)', '=MIN(F2:F6)', '']
  ]
  
  sampleData.forEach((rowData, row) => {
    rowData.forEach((value, col) => {
      if (typeof value === 'string' && value.startsWith('=')) {
        store.setCell(row, col, { formula: value, value: null }, false)
      } else {
        store.setCell(row, col, { value }, false)
      }
    })
  })
  
  store.applyStyle(
    { start: { row: 0, col: 0 }, end: { row: 0, col: 6 } },
    { bold: true, backgroundColor: '#eff6ff', textAlign: 'center' }
  )
  
  store.applyStyle(
    { start: { row: 6, col: 0 }, end: { row: 6, col: 6 } },
    { bold: true, backgroundColor: '#f0fdf4' }
  )
  
  store.applyStyle(
    { start: { row: 1, col: 5 }, end: { row: 6, col: 6 } },
    { numberFormat: 'number', decimalPlaces: 0 }
  )
  
  store.applyStyle(
    { start: { row: 1, col: 6 }, end: { row: 6, col: 6 } },
    { numberFormat: 'percentage', decimalPlaces: 2 }
  )
  
  store.setColWidth(0, 120)
  store.setColWidth(5, 120)
  store.setColWidth(6, 120)
  
  store.recalculateAllFormulas()
}

onMounted(() => {
  loadDemoData()
})
</script>

<style scoped>
.demo-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.demo-header {
  padding: 20px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.demo-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 700;
}

.demo-header p {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.demo-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.feature-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 32px 0;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.feature-tabs button {
  padding: 12px 20px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.feature-tabs button:hover {
  color: #3b82f6;
}

.feature-tabs button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.spreadsheet-wrapper {
  flex: 1;
  padding: 20px 32px;
  overflow: hidden;
}

.features-grid {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.feature-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.feature-card h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.feature-card ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.feature-card li {
  padding: 4px 0;
  font-size: 13px;
  color: #6b7280;
  padding-left: 20px;
  position: relative;
}

.feature-card li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #10b981;
  font-weight: bold;
}

.api-docs {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}

.api-docs h2 {
  margin: 0 0 24px 0;
  font-size: 20px;
  color: #1f2937;
}

.api-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.api-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #374151;
}

.api-section table {
  width: 100%;
  border-collapse: collapse;
}

.api-section th,
.api-section td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
}

.api-section th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.api-section td {
  color: #6b7280;
}

.api-section code {
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'Consolas', monospace;
  font-size: 12px;
  color: #7c3aed;
}

.api-section kbd {
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  font-family: 'Consolas', monospace;
  font-size: 12px;
  color: #374151;
}

.performance-test {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}

.performance-test h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #1f2937;
}

.performance-test p {
  margin: 0 0 24px 0;
  color: #6b7280;
}

.test-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.test-controls button {
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.test-controls button:hover {
  background: #2563eb;
}

.test-result {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.test-result p {
  margin: 8px 0;
  font-size: 14px;
  color: #374151;
}
</style>
