<template>
  <div class="flash-sale-list">
    <div class="main-content">
      <el-card class="search-card">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="活动标题">
            <el-input
              v-model="searchForm.title"
              placeholder="请输入活动标题"
              clearable
              style="width: 200px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-select
              v-model="searchForm.status"
              placeholder="请选择状态"
              clearable
              style="width: 150px"
            >
              <el-option
                v-for="item in flashSaleStore.statusMap"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
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
            <span>秒杀活动列表</span>
            <el-button type="primary" @click="handleCreate">
              <el-icon><Plus /></el-icon>
              新建活动
            </el-button>
          </div>
        </template>

        <el-table
          v-loading="flashSaleStore.loading"
          :data="flashSaleStore.flashSaleList"
          stripe
          style="width: 100%"
        >
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="title" label="活动标题" min-width="200">
            <template #default="{ row }">
              <div class="title-cell">
                <el-avatar :size="40" :src="row.mainImage">
                  <el-icon><Picture /></el-icon>
                </el-avatar>
                <div class="title-info">
                  <div class="title-text">{{ row.title }}</div>
                  <div class="subtitle-text">{{ row.subtitle }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="couponName" label="关联卡券" width="150">
            <template #default="{ row }">
              <el-tag type="warning" size="small">{{ row.couponName }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="projectName" label="关联项目" width="130">
            <template #default="{ row }">
              <el-tag v-if="row.projectName" type="info" size="small">
                {{ row.projectName }}
              </el-tag>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="flashSaleStore.getStatusInfo(row.status).type">
                {{ flashSaleStore.getStatusInfo(row.status).label }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="startTime" label="活动时间" min-width="250">
            <template #default="{ row }">
              <div class="time-range">
                <div class="time-item">
                  <span class="time-label">开始:</span>
                  <span>{{ row.startTime }}</span>
                </div>
                <div class="time-item">
                  <span class="time-label">结束:</span>
                  <span>{{ row.endTime }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" fixed="right" width="200">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleDetail(row)">
                详情
              </el-button>
              <el-button type="primary" size="small" link @click="handleEdit(row)">
                编辑
              </el-button>
              <el-button type="danger" size="small" link @click="handleDelete(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="flashSaleStore.total"
          layout="total, sizes, prev, pager, next, jumper"
          class="pagination"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </el-card>
    </div>

    <div class="tree-filter-panel">
      <div class="panel-header">
        <span class="panel-title">项目筛选</span>
        <div class="panel-actions">
          <el-button type="text" size="small" @click="handleResetProjectFilter">
            重置
          </el-button>
        </div>
      </div>
      <div class="tree-container">
        <el-tree
          ref="projectTreeRef"
          :data="projectTreeData"
          :props="{ label: 'label', children: 'children' }"
          show-checkbox
          node-key="id"
          :check-strictly="false"
          default-expand-all
          highlight-current
          @check="handleProjectCheck"
        >
          <template #default="{ node, data }">
            <span class="custom-tree-node">
              <span v-if="data.type === 'city'" class="city-node">
                <el-icon><OfficeBuilding /></el-icon>
                <span>{{ node.label }}</span>
                <el-tag v-if="data.projectCount" size="small" type="info" effect="light">
                  {{ data.projectCount }}个项目
                </el-tag>
              </span>
              <span v-else class="project-node">
                <el-icon><Location /></el-icon>
                <span>{{ node.label }}</span>
              </span>
            </span>
          </template>
        </el-tree>
      </div>
      <div class="selected-summary" v-if="selectedProjectIds.length > 0">
        <span>已选择 <strong>{{ selectedProjectIds.length }}</strong> 个项目</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFlashSaleStore } from '@/stores/flashSale'
import { useProjectStore } from '@/stores/project'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()
const flashSaleStore = useFlashSaleStore()
const projectStore = useProjectStore()

const projectTreeRef = ref(null)

const searchForm = ref({
  title: '',
  status: '',
  projectIds: []
})

const pagination = ref({
  page: 1,
  pageSize: 10
})

const selectedProjectIds = ref([])

const projectTreeData = computed(() => {
  const projects = projectStore.allProjects
  const cityMap = new Map()

  projects.forEach(project => {
    if (!cityMap.has(project.city)) {
      cityMap.set(project.city, {
        id: `city_${project.city}`,
        label: project.city,
        type: 'city',
        projectCount: 0,
        children: []
      })
    }
    const cityNode = cityMap.get(project.city)
    cityNode.children.push({
      id: project.id,
      label: project.name,
      type: 'project',
      project
    })
    cityNode.projectCount++
  })

  return Array.from(cityMap.values())
})

const fetchData = () => {
  flashSaleStore.fetchFlashSaleList({
    ...searchForm.value,
    projectIds: selectedProjectIds.value,
    page: pagination.value.page,
    pageSize: pagination.value.pageSize
  })
}

const handleSearch = () => {
  pagination.value.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.value = {
    title: '',
    status: '',
    projectIds: []
  }
  pagination.value.page = 1
  fetchData()
}

const handleResetProjectFilter = () => {
  if (projectTreeRef.value) {
    projectTreeRef.value.setCheckedKeys([])
  }
  selectedProjectIds.value = []
  handleSearch()
}

const handleProjectCheck = (data, checkedNodes) => {
  const allChecked = projectTreeRef.value.getCheckedNodes()
  const projectIds = allChecked
    .filter(node => node.type === 'project')
    .map(node => node.id)
  selectedProjectIds.value = projectIds
  handleSearch()
}

const loadProjects = async () => {
  await projectStore.fetchAllProjects()
}

const handleCreate = () => {
  if (selectedProjectIds.value.length === 0) {
    ElMessage.warning('创建秒杀活动时必须选择一个项目，请在右侧树形筛选中选择一个项目')
    return
  }
  if (selectedProjectIds.value.length > 1) {
    ElMessage.warning('创建秒杀活动时仅能选择一个项目，请先取消部分选中')
    return
  }
  router.push({
    path: '/flash-sale/create',
    query: { projectId: selectedProjectIds.value[0] }
  })
}

const handleDetail = (row) => {
  router.push(`/flash-sale/detail/${row.id}`)
}

const handleEdit = (row) => {
  router.push(`/flash-sale/edit/${row.id}`)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除秒杀活动"${row.title}"吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    flashSaleStore.removeFlashSale(row.id).then(() => {
      ElMessage.success('删除成功')
      fetchData()
    })
  }).catch(() => {})
}

const handleSizeChange = (size) => {
  pagination.value.pageSize = size
  fetchData()
}

const handleCurrentChange = (page) => {
  pagination.value.page = page
  fetchData()
}

onMounted(() => {
  loadProjects()
  fetchData()
})
</script>

<style scoped>
.flash-sale-list {
  height: 100%;
  display: flex;
  gap: 20px;
}

.main-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.search-card {
  margin-bottom: 20px;
  flex-shrink: 0;
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
  overflow: hidden;
}

.table-card :deep(.el-table) {
  flex: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-cell {
  display: flex;
  align-items: center;
}

.title-info {
  margin-left: 10px;
}

.title-text {
  font-weight: 500;
  color: #303133;
}

.subtitle-text {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.time-range {
  font-size: 12px;
}

.time-item {
  margin: 2px 0;
}

.time-label {
  color: #909399;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

.tree-filter-panel {
  width: 280px;
  flex-shrink: 0;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.panel-actions {
  flex-shrink: 0;
}

.tree-container {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.custom-tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}

.city-node {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  color: #303133;
}

.project-node {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #606266;
}

.selected-summary {
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  background-color: #fafafa;
  flex-shrink: 0;
  font-size: 14px;
  color: #606266;
}

.selected-summary strong {
  color: #409eff;
}

.text-muted {
  color: #909399;
  font-size: 12px;
}
</style>
