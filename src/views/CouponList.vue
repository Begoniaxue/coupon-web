<template>
  <div class="coupon-list">
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="卡券名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入卡券名称"
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
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="0" />
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
          <span>卡券列表</span>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新建卡券
          </el-button>
        </div>
      </template>

      <el-table
        v-loading="couponStore.loading"
        :data="couponStore.couponList"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="卡券名称" min-width="180">
          <template #default="{ row }">
            <div class="name-cell">
              <el-avatar :size="40" :src="row.mainImage">
                <el-icon><Picture /></el-icon>
              </el-avatar>
              <div class="name-info">
                <div class="name-text">{{ row.name }}</div>
                <div class="name-code">{{ row.code }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 1 ? 'primary' : 'warning'">
              {{ couponStore.getTypeInfo(row.type).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="value" label="面值" width="120">
          <template #default="{ row }">
            <span class="value-text">
              {{ row.type === 1 ? `￥${row.value}` : `${row.value}折` }}
            </span>
            <div v-if="row.minAmount > 0" class="min-amount">
              满{{ row.minAmount }}可用
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="couponStore.getStatusInfo(row.status).type">
              {{ couponStore.getStatusInfo(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="weight" label="权重" width="100">
          <template #default="{ row }">
            <el-input-number
              v-model="row.weight"
              :min="0"
              :max="100"
              size="small"
              @change="(val) => handleWeightChange(row.id, val)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="库存/已用" width="120">
          <template #default="{ row }">
            <span>{{ row.usedQuantity }} / {{ row.quantity }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="endTime" label="有效期" min-width="180">
          <template #default="{ row }">
            <div class="validity">
              <div>{{ row.startTime }}</div>
              <div class="arrow">至</div>
              <div>{{ row.endTime }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="250">
          <template #default="{ row }">
            <el-button
              :type="row.status === 1 ? 'warning' : 'success'"
              size="small"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 1 ? '下架' : '上架' }}
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
        :total="couponStore.total"
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
import { useCouponStore } from '@/stores/coupon'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()
const couponStore = useCouponStore()

const searchForm = ref({
  name: '',
  status: ''
})

const pagination = ref({
  page: 1,
  pageSize: 10
})

const fetchData = () => {
  couponStore.fetchCouponList({
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
    status: ''
  }
  pagination.value.page = 1
  fetchData()
}

const handleCreate = () => {
  router.push('/create')
}

const handleDetail = (row) => {
  router.push(`/detail/${row.id}`)
}

const handleEdit = (row) => {
  router.push(`/edit/${row.id}`)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除卡券"${row.name}"吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    couponStore.removeCoupon(row.id).then(() => {
      ElMessage.success('删除成功')
      fetchData()
    })
  }).catch(() => {})
}

const handleToggleStatus = (row) => {
  const newStatus = row.status === 1 ? 0 : 1
  const action = newStatus === 1 ? '上架' : '下架'
  ElMessageBox.confirm(
    `确定要${action}卡券"${row.name}"吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    couponStore.toggleStatus(row.id, newStatus).then((res) => {
      ElMessage.success(res.message)
      fetchData()
    })
  }).catch(() => {})
}

const handleWeightChange = (id, weight) => {
  couponStore.changeWeight(id, weight).then((res) => {
    ElMessage.success(res.message)
    fetchData()
  })
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
.coupon-list {
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

.name-cell {
  display: flex;
  align-items: center;
}

.name-info {
  margin-left: 10px;
}

.name-text {
  font-weight: 500;
  color: #303133;
}

.name-code {
  font-size: 12px;
  color: #909399;
}

.value-text {
  font-weight: bold;
  color: #f56c6c;
}

.min-amount {
  font-size: 12px;
  color: #909399;
}

.validity {
  font-size: 12px;
}

.validity .arrow {
  margin: 2px 0;
  color: #909399;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
