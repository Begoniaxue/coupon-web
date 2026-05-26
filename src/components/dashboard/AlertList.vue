<template>
  <div class="alert-container">
    <div class="alert-header">
      <el-icon><Warning /></el-icon>
      <span>实时告警</span>
      <el-badge :value="unreadCount" class="alert-badge" />
    </div>
    <div class="alert-list" ref="listRef">
      <transition-group name="alert-item">
        <div
          v-for="item in data"
          :key="item.id"
          class="alert-item"
          :class="item.type"
        >
          <el-icon class="alert-icon">
            <CircleCheck v-if="item.type === 'success'" />
            <CircleClose v-else-if="item.type === 'error'" />
            <WarningFilled v-else-if="item.type === 'warning'" />
            <InfoFilled v-else />
          </el-icon>
          <div class="alert-content">
            <div class="alert-message">{{ item.message }}</div>
            <div class="alert-meta">
              <span class="alert-source">{{ item.source }}</span>
              <span class="alert-time">{{ item.time }}</span>
            </div>
          </div>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { Warning, WarningFilled, InfoFilled, CircleCheck, CircleClose } from '@element-plus/icons-vue'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  }
})

const listRef = ref(null)

const unreadCount = computed(() => {
  return props.data.filter(d => d.type === 'error' || d.type === 'warning').length
})

watch(() => props.data.length, () => {
  nextTick(() => {
    if (listRef.value) {
      listRef.value.scrollTop = 0
    }
  })
})
</script>

<style scoped>
.alert-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 180, 255, 0.2);
  color: #00b4ff;
  font-size: 14px;
  font-weight: bold;
  flex-shrink: 0;
}

.alert-badge {
  margin-left: auto;
}

.alert-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 180, 255, 0.3) transparent;
}

.alert-list::-webkit-scrollbar {
  width: 4px;
}

.alert-list::-webkit-scrollbar-track {
  background: transparent;
}

.alert-list::-webkit-scrollbar-thumb {
  background: rgba(0, 180, 255, 0.3);
  border-radius: 2px;
}

.alert-item {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 6px;
  background: rgba(0, 0, 0, 0.2);
  border-left: 3px solid;
  border-radius: 4px;
  transition: all 0.3s;
}

.alert-item:hover {
  background: rgba(0, 180, 255, 0.1);
  transform: translateX(4px);
}

.alert-item.error {
  border-color: #f56c6c;
  background: rgba(245, 108, 108, 0.05);
}

.alert-item.warning {
  border-color: #e6a23c;
  background: rgba(230, 162, 60, 0.05);
}

.alert-item.info {
  border-color: #00b4ff;
}

.alert-item.success {
  border-color: #67c23a;
}

.alert-icon {
  flex-shrink: 0;
  font-size: 18px;
  margin-top: 2px;
}

.alert-item.error .alert-icon { color: #f56c6c; }
.alert-item.warning .alert-icon { color: #e6a23c; }
.alert-item.info .alert-icon { color: #00b4ff; }
.alert-item.success .alert-icon { color: #67c23a; }

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-message {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.alert-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.alert-item-enter-active,
.alert-item-leave-active {
  transition: all 0.5s;
}

.alert-item-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.alert-item-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.alert-item-move {
  transition: transform 0.5s;
}
</style>
