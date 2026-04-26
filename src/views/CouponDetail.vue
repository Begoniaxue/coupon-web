<template>
  <div class="coupon-detail">
    <el-card v-loading="couponStore.loading">
      <template #header>
        <div class="card-header">
          <el-button type="text" class="back-btn" @click="handleBack">
            <el-icon><ArrowLeft /></el-icon>
            返回列表
          </el-button>
          <span>卡券详情</span>
          <div class="header-actions">
            <el-button type="primary" @click="handleEdit">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
          </div>
        </div>
      </template>

      <div v-if="coupon" class="detail-content">
        <el-row :gutter="40">
          <el-col :span="8">
            <div class="main-image-section">
              <el-image
                :src="coupon.mainImage"
                fit="cover"
                class="main-image"
                :preview-src-list="[coupon.mainImage]"
              >
                <template #placeholder>
                  <el-skeleton :rows="1" animated />
                </template>
              </el-image>
              <div class="status-badge">
                <el-tag :type="couponStore.getStatusInfo(coupon.status).type" size="large">
                  {{ couponStore.getStatusInfo(coupon.status).label }}
                </el-tag>
              </div>
            </div>

            <el-card class="info-card" shadow="never">
              <template #header>
                <span class="info-card-title">发放统计</span>
              </template>
              <el-row :gutter="20">
                <el-col :span="12" class="stat-item">
                  <div class="stat-value">{{ coupon.quantity }}</div>
                  <div class="stat-label">总发放量</div>
                </el-col>
                <el-col :span="12" class="stat-item">
                  <div class="stat-value used">{{ coupon.usedQuantity }}</div>
                  <div class="stat-label">已使用</div>
                </el-col>
                <el-col :span="12" class="stat-item">
                  <div class="stat-value remaining">{{ coupon.quantity - coupon.usedQuantity }}</div>
                  <div class="stat-label">剩余数量</div>
                </el-col>
                <el-col :span="12" class="stat-item">
                  <div class="stat-value rate">{{ usageRate }}%</div>
                  <div class="stat-label">使用率</div>
                </el-col>
              </el-row>
            </el-card>
          </el-col>

          <el-col :span="16">
            <div class="detail-info">
              <div class="coupon-title">
                <h2>{{ coupon.name }}</h2>
                <el-tag :type="coupon.type === 1 ? 'primary' : 'warning'">
                  {{ couponStore.getTypeInfo(coupon.type).label }}
                </el-tag>
              </div>

              <div class="coupon-value">
                <span class="value-text">
                  {{ coupon.type === 1 ? '￥' + coupon.value : coupon.value + '折' }}
                </span>
                <span v-if="coupon.minAmount > 0" class="value-condition">
                  满{{ coupon.minAmount }}元可用
                </span>
              </div>

              <el-descriptions :column="2" border class="detail-table">
                <el-descriptions-item label="卡券编码">
                  <el-tag>{{ coupon.code }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="权重">
                  <span>{{ coupon.weight }}（数值越大优先级越高）</span>
                </el-descriptions-item>
                <el-descriptions-item label="开始时间">
                  {{ coupon.startTime }}
                </el-descriptions-item>
                <el-descriptions-item label="结束时间">
                  {{ coupon.endTime }}
                </el-descriptions-item>
                <el-descriptions-item label="创建时间" :span="2">
                  {{ coupon.createTime }}
                </el-descriptions-item>
              </el-descriptions>

              <el-divider content-position="left">卡券描述</el-divider>
              <div class="description-section">
                <p v-if="coupon.description" class="description-text">
                  {{ coupon.description }}
                </p>
                <el-empty v-else description="暂无描述" :image-size="80" />
              </div>

              <el-divider content-position="left" v-if="coupon.contentImages && coupon.contentImages.length > 0">
                内容图片
              </el-divider>
              <div class="content-images-section" v-if="coupon.contentImages && coupon.contentImages.length > 0">
                <el-row :gutter="15">
                  <el-col :span="6" v-for="(img, index) in coupon.contentImages" :key="index">
                    <el-image
                      :src="img"
                      fit="cover"
                      class="content-image"
                      :preview-src-list="coupon.contentImages"
                      :initial-index="index"
                    />
                  </el-col>
                </el-row>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <el-empty v-else description="卡券不存在" />
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCouponStore } from '@/stores/coupon'

const route = useRoute()
const router = useRouter()
const couponStore = useCouponStore()

const coupon = computed(() => couponStore.currentCoupon)

const usageRate = computed(() => {
  if (!coupon.value) return 0
  if (coupon.value.quantity === 0) return 0
  return ((coupon.value.usedQuantity / coupon.value.quantity) * 100).toFixed(1)
})

const handleBack = () => {
  router.push('/')
}

const handleEdit = () => {
  if (coupon.value) {
    router.push(`/edit/${coupon.value.id}`)
  }
}

const loadData = async () => {
  const id = route.params.id
  if (id) {
    await couponStore.fetchCouponDetail(id)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.coupon-detail {
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

.stat-item {
  text-align: center;
  padding: 15px 0;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
}

.stat-value.used {
  color: #67c23a;
}

.stat-value.remaining {
  color: #e6a23c;
}

.stat-value.rate {
  color: #909399;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.coupon-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}

.coupon-title h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.coupon-value {
  margin-bottom: 20px;
}

.value-text {
  font-size: 36px;
  font-weight: bold;
  color: #f56c6c;
}

.value-condition {
  margin-left: 15px;
  font-size: 14px;
  color: #909399;
}

.detail-table {
  margin-bottom: 20px;
}

.description-section {
  padding: 10px 0;
}

.description-text {
  line-height: 1.8;
  color: #606266;
  white-space: pre-wrap;
}

.content-images-section {
  padding: 10px 0;
}

.content-image {
  width: 100%;
  height: 120px;
  border-radius: 4px;
}
</style>
