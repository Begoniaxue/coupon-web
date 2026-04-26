<template>
  <div class="project-list">
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="项目名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入项目名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="城市">
          <el-input
            v-model="searchForm.city"
            placeholder="请输入城市"
            clearable
            style="width: 150px"
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
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
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
          <span>项目列表</span>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新建项目
          </el-button>
        </div>
      </template>

      <el-table
        v-loading="projectStore.loading"
        :data="projectStore.projectList"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="项目名称" min-width="180" />
        <el-table-column prop="totalArea" label="总建面积(㎡)" width="140">
          <template #default="{ row }">
            <span>{{ row.totalArea?.toLocaleString() || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="city" label="城市" width="100" />
        <el-table-column prop="district" label="区域" width="100" />
        <el-table-column prop="address" label="详细地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="floorCount" label="楼层数" width="100" />
        <el-table-column prop="buildingCount" label="楼栋数" width="100" />
        <el-table-column prop="resourceCount" label="资源位数" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="projectStore.getStatusInfo(row.status).type">
              {{ projectStore.getStatusInfo(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" fixed="right" width="250">
          <template #default="{ row }">
            <el-button
              :type="row.status === 1 ? 'warning' : 'success'"
              size="small"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 1 ? '停用' : '启用' }}
            </el-button>
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
        :total="projectStore.total"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()
const projectStore = useProjectStore()

const searchForm = ref({
  name: '',
  city: '',
  status: ''
})

const pagination = ref({
  page: 1,
  pageSize: 10
})

const fetchData = () => {
  projectStore.fetchProjectList({
    ...searchForm.value,
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
    name: '',
    city: '',
    status: ''
  }
  pagination.value.page = 1
  fetchData()
}

const handleCreate = () => {
  router.push('/project/create')
}

const handleDetail = (row) => {
  router.push(`/project/detail/${row.id}`)
}

const handleEdit = (row) => {
  router.push(`/project/edit/${row.id}`)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除项目"${row.name}"吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    projectStore.removeProject(row.id).then(() => {
      ElMessage.success('删除成功')
      fetchData()
    })
  }).catch(() => {})
}

const handleToggleStatus = (row) => {
  const newStatus = row.status === 1 ? 0 : 1
  const action = newStatus === 1 ? '启用' : '停用'
  ElMessageBox.confirm(
    `确定要${action}项目"${row.name}"吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    projectStore.toggleStatus(row.id, newStatus).then((res) => {
      ElMessage.success(res.message)
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
  fetchData()
})
</script>

<style scoped>
.project-list {
  height: 100%;
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  min-height: calc(100% - 140px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
