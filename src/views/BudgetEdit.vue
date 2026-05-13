<template>
  <div class="budget-edit-page">
    <el-card class="page-header-card">
      <div class="page-header">
        <div class="page-title">
          <el-icon><DataAnalysis /></el-icon>
          <span>预算编辑</span>
        </div>
        <div class="header-actions">
          <el-button @click="handleRefreshData">
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
          <el-button type="primary" @click="handleExportData">
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
        </div>
      </div>
      
      <div class="page-stats">
        <el-statistic title="总数据行数" :value="tableData.length" />
        <el-statistic title="总列数" :value="totalColumns" />
        <el-statistic title="选中单元格" :value="selectedCellCount" />
      </div>
    </el-card>

    <el-card class="table-card">
      <div class="table-container">
        <VirtualTable
          :data="tableData"
          :columns="tableColumns"
          :row-height="42"
          :frozen-left-columns="3"
          :default-column-width="100"
          @cell-click="handleCellClick"
          @cell-edit="handleCellEdit"
          @sort-change="handleSortChange"
        />
      </div>
    </el-card>

    <el-card class="info-panel" v-if="selectedCell">
      <template #header>
        <div class="info-panel-header">
          <span>单元格信息</span>
          <el-button type="text" size="small" @click="selectedCell = null">关闭</el-button>
        </div>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="行号">{{ selectedCell.row + 1 }}</el-descriptions-item>
        <el-descriptions-item label="列名">{{ selectedCell.column?.title }}</el-descriptions-item>
        <el-descriptions-item label="资源编号">{{ selectedCell.rowData?.resourceCode }}</el-descriptions-item>
        <el-descriptions-item label="店铺名">{{ selectedCell.rowData?.shopName }}</el-descriptions-item>
        <el-descriptions-item label="当前值" :span="2">{{ selectedCell.value }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { DataAnalysis, Refresh, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import VirtualTable from '@/components/VirtualTable.vue'

const currentYear = new Date().getFullYear()
const years = [currentYear - 2, currentYear - 1, currentYear]
const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

const tableData = ref([])
const selectedCell = ref(null)
const selectedCellCount = ref(0)

const generateMonthColumns = () => {
  return years.map(year => ({
    title: `${year}年`,
    prop: `year_${year}`,
    children: months.map((month, monthIndex) => ({
      title: month,
      prop: `budget_${year}_${monthIndex + 1}`,
      width: 90,
      sortable: true,
      editable: true,
      type: 'number',
      formatter: (row) => {
        const value = row[`budget_${year}_${monthIndex + 1}`]
        if (value === undefined || value === null) return '-'
        if (typeof value === 'number') {
          return value.toLocaleString('zh-CN')
        }
        return value
      }
    }))
  }))
}

const tableColumns = computed(() => [
  {
    title: '资源编号',
    prop: 'resourceCode',
    width: 140,
    sortable: true,
    editable: true
  },
  {
    title: '店铺名',
    prop: 'shopName',
    width: 180,
    sortable: true,
    editable: true
  },
  {
    title: '面积(㎡)',
    prop: 'area',
    width: 100,
    sortable: true,
    editable: true,
    type: 'number',
    formatter: (row) => {
      const value = row.area
      if (value === undefined || value === null) return '-'
      if (typeof value === 'number') {
        return value.toLocaleString('zh-CN')
      }
      return value
    }
  },
  ...generateMonthColumns()
])

const totalColumns = computed(() => {
  let count = 0
  const countColumns = (columns) => {
    columns.forEach(col => {
      if (col.children) {
        countColumns(col.children)
      } else {
        count++
      }
    })
  }
  countColumns(tableColumns.value)
  return count
})

const shopNames = [
  '星巴克', '肯德基', '麦当劳', '优衣库', 'H&M', 'ZARA', '无印良品', '海底捞',
  '大润发', '沃尔玛', '家乐福', '永辉超市', '屈臣氏', '丝芙兰', '迪卡侬', '宜家',
  '苹果店', '华为体验店', '小米之家', '苏宁易购', '国美', '五星电器', '京东之家',
  '周大福', '周生生', '老凤祥', '六福珠宝', '施华洛世奇', '潘多拉', '卡地亚',
  '耐克', '阿迪达斯', '李宁', '安踏', '特步', '361度', '彪马', '新百伦',
  '必胜客', '汉堡王', '德克士', '华莱士', '真功夫', '老乡鸡', '西贝莜面',
  '外婆家', '绿茶', '炉鱼', '南京大排档', '小南国', '俏江南', '外婆家',
  '喜茶', '奈雪的茶', '星巴克臻选', '瑞幸咖啡', 'CoCo都可', '一点点', '书亦烧仙草',
  '名创优品', '纪念日百货', '三福', '热风', '西遇', '百丽', '他她', '天美意',
  'ONLY', 'VERO MODA', 'JACK & JONES', 'SELECTED', '太平鸟', '哥弟', '阿玛施',
  'GXG', '马克华菲', '卡宾', '七匹狼', '劲霸', '利郎', '柒牌', '海澜之家',
  '优衣库', 'GAP', 'Old Navy', 'C&A', 'Forever 21', 'UR', 'OYSHO',
  '海底捞火锅', '呷哺呷哺', '小龙坎', '大龙燚', '蜀大侠', '谭鸭血', '贤合庄',
  '味千拉面', '康师傅私房牛肉面', '吉野家', '永和大王', '真功夫', '老乡鸡', '乡村基',
  '必胜客', '棒约翰', '达美乐', '豪客来', '西堤牛排', '王品牛排', '赤坂亭',
  '和府捞面', '陈香贵', '马记永', '张拉拉', '遇见小面', '阿香米线', '蒙自源'
]

const generateMockData = (count) => {
  const data = []
  for (let i = 0; i < count; i++) {
    const row = {
      id: i + 1,
      resourceCode: `RES${String(i + 1).padStart(8, '0')}`,
      shopName: `${shopNames[i % shopNames.length]}${Math.floor(i / shopNames.length) + 1 > 1 ? '(' + Math.floor(i / shopNames.length) + '店)' : ''}`,
      area: Math.floor(Math.random() * 5000) + 100
    }
    
    years.forEach(year => {
      for (let m = 1; m <= 12; m++) {
        const baseValue = Math.floor(Math.random() * 500000) + 50000
        row[`budget_${year}_${m}`] = Math.floor(baseValue + Math.random() * 200000)
      }
    })
    
    data.push(row)
  }
  return data
}

const handleCellClick = (info) => {
  selectedCell.value = info
  selectedCellCount.value = info.column ? 1 : 0
}

const handleCellEdit = (info) => {
  const { row, prop, newValue } = info
  tableData.value[row][prop] = newValue
  
  ElMessage.success({
    message: `单元格已更新: ${prop} = ${newValue}`,
    duration: 1500
  })
}

const handleSortChange = (sortInfo) => {
  const { prop, order } = sortInfo
  
  if (!order) {
    tableData.value.sort((a, b) => a.id - b.id)
    return
  }
  
  tableData.value.sort((a, b) => {
    let aVal = a[prop]
    let bVal = b[prop]
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return order === 'asc' ? aVal - bVal : bVal - aVal
    }
    
    aVal = String(aVal || '')
    bVal = String(bVal || '')
    const result = aVal.localeCompare(bVal, 'zh-CN')
    return order === 'asc' ? result : -result
  })
}

const handleRefreshData = () => {
  const startTime = Date.now()
  tableData.value = generateMockData(10000)
  const endTime = Date.now()
  
  ElMessage.success({
    message: `数据已刷新: 10000行 × ${totalColumns.value}列，耗时 ${endTime - startTime}ms`,
    duration: 3000
  })
}

const handleExportData = () => {
  ElMessage.info('导出功能开发中...')
}

onMounted(() => {
  handleRefreshData()
})
</script>

<style scoped>
.budget-edit-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  box-sizing: border-box;
  background-color: #f0f2f5;
}

.page-header-card {
  flex-shrink: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.page-title .el-icon {
  color: #409eff;
  font-size: 24px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.page-stats {
  display: flex;
  gap: 40px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.table-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.table-container {
  flex: 1;
  min-height: 0;
  padding: 20px;
}

.info-panel {
  flex-shrink: 0;
  max-height: 200px;
}

.info-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:deep(.el-statistic__head) {
  font-size: 14px;
  color: #909399;
}

:deep(.el-statistic__number) {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}
</style>