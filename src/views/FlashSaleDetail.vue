<template>
  <div class="flash-sale-detail">
    <el-card v-loading="flashSaleStore.loading">
      <template #header>
        <div class="card-header">
          <el-button type="text" class="back-btn" @click="handleBack">
            <el-icon><ArrowLeft /></el-icon>
            返回列表
          </el-button>
          <span>秒杀活动详情</span>
          <div class="header-actions">
            <el-button type="primary" @click="handleEdit">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
          </div>
        </div>
      </template>

      <div v-if="flashSale" class="detail-content">
        <el-row :gutter="40">
          <el-col :span="8">
            <div class="main-image-section">
              <el-image
                :src="flashSale.mainImage"
                fit="cover"
                class="main-image"
                :preview-src-list="[flashSale.mainImage]"
              >
                <template #placeholder>
                  <el-skeleton :rows="1" animated />
                </template>
              </el-image>
              <div class="status-badge">
                <el-tag :type="flashSaleStore.getStatusInfo(flashSale.status).type" size="large">
                  {{ flashSaleStore.getStatusInfo(flashSale.status).label }}
                </el-tag>
              </div>
            </div>

            <el-card class="info-card" shadow="never">
              <template #header>
                <span class="info-card-title">活动信息</span>
              </template>
              <div class="info-item">
                <div class="info-label">活动状态</div>
                <div class="info-value">
                  <el-tag :type="flashSaleStore.getStatusInfo(flashSale.status).type">
                    {{ flashSaleStore.getStatusInfo(flashSale.status).label }}
                  </el-tag>
                </div>
              </div>
              <div class="info-item">
                <div class="info-label">关联卡券</div>
                <div class="info-value">
                  <el-tag type="warning">{{ flashSale.couponName }}</el-tag>
                </div>
              </div>
              <div class="info-item">
                <div class="info-label">创建时间</div>
                <div class="info-value">{{ flashSale.createTime }}</div>
              </div>
            </el-card>
          </el-col>

          <el-col :span="16">
            <div class="detail-info">
              <div class="flash-sale-title">
                <h2>{{ flashSale.title }}</h2>
              </div>
              <div class="flash-sale-subtitle">
                <p>{{ flashSale.subtitle }}</p>
              </div>

              <el-descriptions :column="2" border class="detail-table">
                <el-descriptions-item label="开始时间">
                  {{ flashSale.startTime }}
                </el-descriptions-item>
                <el-descriptions-item label="结束时间">
                  {{ flashSale.endTime }}
                </el-descriptions-item>
                <el-descriptions-item label="关联卡券ID" :span="2">
                  <el-tag>{{ flashSale.couponId }}</el-tag>
                </el-descriptions-item>
              </el-descriptions>

              <el-divider content-position="left">活动内容</el-divider>
              <div class="content-section">
                <div v-if="sanitizedContent" class="content-html" v-html="sanitizedContent"></div>
                <el-empty v-else description="暂无活动内容" :image-size="80" />
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <el-empty v-else description="秒杀活动不存在" />
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFlashSaleStore } from '@/stores/flashSale'
import { sanitizeHtml } from '@/utils/security'

const route = useRoute()
const router = useRouter()
const flashSaleStore = useFlashSaleStore()

const flashSale = computed(() => flashSaleStore.currentFlashSale)

const sanitizedContent = computed(() => {
  if (flashSale.value && flashSale.value.content) {
    return sanitizeHtml(flashSale.value.content)
  }
  return ''
})

const handleBack = () => {
  router.push('/flash-sale')
}

const handleEdit = () => {
  if (flashSale.value) {
    router.push(`/flash-sale/edit/${flashSale.value.id}`)
  }
}

const loadData = async () => {
  const id = route.params.id
  if (id) {
    await flashSaleStore.fetchFlashSaleDetail(id)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.flash-sale-detail {
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

.main-image-section {
  position: relative;
  margin-bottom: 20px;
}

.main-image {
  width: 100%;
  height: 220px;
  border-radius: 8px;
}

.status-badge {
  position: absolute;
  top: 10px;
  right: 10px;
}

.info-card {
  border: 1px solid #ebeef5;
}

.info-card-title {
  font-weight: 500;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: #909399;
  font-size: 14px;
}

.info-value {
  color: #303133;
  font-size: 14px;
}

.flash-sale-title {
  margin-bottom: 10px;
}

.flash-sale-title h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.flash-sale-subtitle {
  margin-bottom: 20px;
}

.flash-sale-subtitle p {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.detail-table {
  margin-bottom: 20px;
}

.content-section {
  padding: 10px 0;
}

.content-html {
  line-height: 1.8;
  color: #606266;
}

.content-html :deep(p) {
  margin: 10px 0;
}

.content-html :deep(ul) {
  margin: 10px 0;
  padding-left: 20px;
}

.content-html :deep(li) {
  margin: 5px 0;
}

.content-html :deep(strong) {
  font-weight: bold;
}

.content-html :deep(em) {
  font-style: italic;
}
</style>
