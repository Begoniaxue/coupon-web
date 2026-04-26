<template>
  <div class="project-detail">
    <el-card v-loading="projectStore.loading">
      <template #header>
        <div class="card-header">
          <el-button type="text" class="back-btn" @click="handleBack">
            <el-icon><ArrowLeft /></el-icon>
            返回列表
          </el-button>
          <span>项目详情</span>
          <div class="header-actions">
            <el-button type="primary" @click="handleEdit">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
          </div>
        </div>
      </template>

      <div v-if="project" class="detail-content">
        <div class="project-header">
          <h2>{{ project.name }}</h2>
          <el-tag :type="projectStore.getStatusInfo(project.status).type" size="large">
            {{ projectStore.getStatusInfo(project.status).label }}
          </el-tag>
        </div>

        <el-descriptions :column="2" border class="detail-table">
          <el-descriptions-item label="总建面积">
            <span>{{ project.totalArea?.toLocaleString() || 0 }} 平方米</span>
          </el-descriptions-item>
          <el-descriptions-item label="资源位总数">
            <span>{{ project.resourceCount }} 个</span>
          </el-descriptions-item>
          <el-descriptions-item label="城市">
            <el-tag type="info">{{ project.city }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="区域">
            <el-tag type="info">{{ project.district }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="详细地址" :span="2">
            <span>{{ project.address }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="楼层数量">
            <span>{{ project.floorCount }} 层</span>
          </el-descriptions-item>
          <el-descriptions-item label="楼栋数量">
            <span>{{ project.buildingCount }} 栋</span>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">
            {{ project.createTime }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">项目统计</el-divider>
        <el-row :gutter="20" class="stat-row">
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-value">{{ project.totalArea?.toLocaleString() || 0 }}</div>
              <div class="stat-label">总建面积 (㎡)</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-value">{{ project.floorCount }}</div>
              <div class="stat-label">楼层数量</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-value">{{ project.buildingCount }}</div>
              <div class="stat-label">楼栋数量</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-value">{{ project.resourceCount }}</div>
              <div class="stat-label">资源位总数</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <el-empty v-else description="项目不存在" />
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()

const project = computed(() => projectStore.currentProject)

const handleBack = () => {
  router.push('/project')
}

const handleEdit = () => {
  if (project.value) {
    router.push(`/project/edit/${project.value.id}`)
  }
}

const loadData = async () => {
  const id = route.params.id
  if (id) {
    await projectStore.fetchProjectDetail(id)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.project-detail {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
}

.card-header .back-btn {
  padding: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.detail-content {
  padding: 10px 0;
}

.project-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.project-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.detail-table {
  margin-bottom: 20px;
}

.stat-row {
  margin-top: 20px;
}

.stat-card {
  text-align: center;
  padding: 25px 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}
</style>
