<template>
  <div class="budget-edit">
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="年份">
          <el-select v-model="filterForm.year" placeholder="选择年份" style="width: 120px">
            <el-option :key="2026" :label="2026" :value="2026" />
            <el-option :key="2025" :label="2025" :value="2025" />
            <el-option :key="2024" :label="2024" :value="2024" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源编号">
          <el-input
            v-model="filterForm.resourceCode"
            placeholder="请输入资源编号"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item label="店铺名">
          <el-input
            v-model="filterForm.shopName"
            placeholder="请输入店铺名"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>预算编辑 (共 {{ tableData.length }} 行数据)</span>
          <div class="header-actions">
            <el-button size="small" type="primary" @click="handleSave">
              保存
            </el-button>
            <el-button size="small" @click="handleExport">
              导出
            </el-button>
            <el-button size="small" @click="handleImport">
              导入
            </el-button>
          </div>
        </div>
      </template>

      <div class="table-info">
        <el-tag size="small">双击单元格编辑</el-tag>
        <el-tag size="small" type="info">点击表头排序</el-tag>
        <el-tag size="small" type="warning">拖动列边框调整列宽</el-tag>
        <el-tag size="small" type="success">前3列固定左侧</el-tag>
      </div>

      <VirtualTable
        ref="tableRef"
        :columns="columns"
        :data="tableData"
        :height="550"
        :row-height="48"
        :header-height="48"
        :frozen-columns="3"
        @cell-click="handleCellClick"
        @cell-edit="handleCellEdit"
        @sort-change="handleSortChange"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import VirtualTable from '@/components/VirtualTable/index.vue'

const tableRef = ref(null)

const filterForm = ref({
  year: 2026,
  resourceCode: '',
  shopName: ''
})

const shopNames = [
  '星巴克咖啡', '麦当劳', '肯德基', '优衣库', 'H&M',
  'ZARA', '无印良品', '屈臣氏', '万宁', '周大福',
  '周生生', '六福珠宝', '老凤祥', '中国黄金', '周大生',
  '李宁', '安踏', '特步', '361度', '鸿星尔克',
  '华为', '苹果', '小米', 'OPPO', 'vivo',
  '耐克', '阿迪达斯', '彪马', '新百伦', '匡威',
  '必胜客', '海底捞', '西贝莜面', '外婆家', '炉鱼',
  '喜茶', '奈雪の茶', '蜜雪冰城', '一点点', 'CoCo都可'
]

const cities = ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉', '西安', '重庆']

const currentYear = new Date().getFullYear()
const years = [currentYear - 2, currentYear - 1, currentYear]
const months = ['01月', '02月', '03月', '04月', '05月', '06月', '07月', '08月', '09月', '10月', '11月', '12月']

const getMonthProp = (year, month) => {
  return `m_${year}_${String(month).padStart(2, '0')}`
}

const generateMockData = (count) => {
  const data = []
  for (let i = 0; i < count; i++) {
    const row = {
      id: i + 1,
      resourceCode: `RES${String(i + 1).padStart(8, '0')}`,
      shopName: shopNames[i % shopNames.length] + (i >= shopNames.length ? `(${i})` : ''),
      area: Math.floor(Math.random() * 2000) + 100
    }
    
    years.forEach(year => {
      for (let m = 1; m <= 12; m++) {
        const prop = getMonthProp(year, m)
        row[prop] = Math.floor(Math.random() * 100000) / 100
      }
    })
    
    data.push(row)
  }
  return data
}

const columns = computed(() => {
  const yearColumns = years.map(year => ({
    label: `${year}年`,
    children: months.map((month, index) => ({
      prop: getMonthProp(year, index + 1),
      label: month,
      width: 100,
      sortable: true,
      resizable: true
    }))
  }))
  
  return [
    {
      prop: 'resourceCode',
      label: '资源编号',
      width: 150,
      sortable: true,
      resizable: true
    },
    {
      prop: 'shopName',
      label: '店铺名',
      width: 180,
      sortable: true,
      resizable: true
    },
    {
      prop: 'area',
      label: '面积(㎡)',
      width: 120,
      sortable: true,
      resizable: true
    },
    ...yearColumns
  ]
})

const originalData = ref([])
const tableData = ref([])
const sortConfig = ref({ prop: null, order: null })

const handleSearch = () => {
  let filtered = [...originalData.value]
  
  if (filterForm.value.resourceCode) {
    filtered = filtered.filter(item => 
      item.resourceCode.toLowerCase().includes(filterForm.value.resourceCode.toLowerCase())
    )
  }
  
  if (filterForm.value.shopName) {
    filtered = filtered.filter(item => 
      item.shopName.toLowerCase().includes(filterForm.value.shopName.toLowerCase())
    )
  }
  
  tableData.value = filtered
  
  if (sortConfig.value.prop && sortConfig.value.order) {
    applySort()
  }
}

const handleReset = () => {
  filterForm.value = {
    year: 2026,
    resourceCode: '',
    shopName: ''
  }
  tableData.value = [...originalData.value]
  if (sortConfig.value.prop && sortConfig.value.order) {
    applySort()
  }
}

const handleCellClick = (params) => {
  console.log('Cell clicked:', params)
}

const handleCellEdit = (params) => {
  console.log('Cell edited:', params)
}

const handleSortChange = (params) => {
  sortConfig.value = params
  
  if (params.order) {
    applySort()
  } else {
    tableData.value = [...originalData.value]
    if (filterForm.value.resourceCode || filterForm.value.shopName) {
      handleSearch()
    }
  }
}

const applySort = () => {
  const { prop, order } = sortConfig.value
  if (!prop || !order) return
  
  tableData.value.sort((a, b) => {
    let valA = a[prop]
    let valB = b[prop]
    
    if (typeof valA === 'string') {
      valA = valA.toLowerCase()
      valB = valB.toLowerCase()
      if (order === 'asc') {
        return valA.localeCompare(valB)
      } else {
        return valB.localeCompare(valA)
      }
    }
    
    if (order === 'asc') {
      return valA - valB
    } else {
      return valB - valA
    }
  })
}

const handleSave = () => {
  ElMessage.success('保存成功')
}

const handleExport = () => {
  ElMessage.info('导出功能开发中...')
}

const handleImport = () => {
  ElMessage.info('导入功能开发中...')
}

onMounted(() => {
  originalData.value = generateMockData(10000)
  tableData.value = [...originalData.value]
})
</script>

<style scoped>
.budget-edit {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.filter-card {
  margin-bottom: 20px;
  flex-shrink: 0;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.table-card {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.table-info {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}
</style>
