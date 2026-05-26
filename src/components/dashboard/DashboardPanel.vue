<template>
  <div class="dashboard-panel" :class="{ 'no-border': noBorder }">
    <div class="panel-header">
      <div class="panel-title">
        <span class="title-icon"></span>
        <slot name="title">{{ title }}</slot>
      </div>
      <div class="panel-actions">
        <slot name="actions"></slot>
        <el-icon v-if="refreshable" class="action-icon" :class="{ spinning: loading }" @click="$emit('refresh')">
          <Refresh />
        </el-icon>
      </div>
    </div>
    <div class="panel-content">
      <slot></slot>
    </div>
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>
  </div>
</template>

<script setup>
import { Refresh } from '@element-plus/icons-vue'

defineProps({
  title: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  },
  refreshable: {
    type: Boolean,
    default: true
  },
  noBorder: {
    type: Boolean,
    default: false
  }
})

defineEmits(['refresh'])
</script>

<style scoped>
.dashboard-panel {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(10, 30, 50, 0.9) 0%,
    rgba(5, 15, 30, 0.95) 100%
  );
  border: 1px solid rgba(0, 180, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dashboard-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(0, 180, 255, 0.05) 50%,
    transparent 100%
  );
  animation: scan 3s linear infinite;
  pointer-events: none;
}

@keyframes scan {
  0% { left: -100%; }
  100% { left: 100%; }
}

.dashboard-panel.no-border {
  border: none;
  background: transparent;
}

.dashboard-panel.no-border::before {
  display: none;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 180, 255, 0.2);
  background: rgba(0, 180, 255, 0.05);
  flex-shrink: 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: bold;
  color: #00ffff;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
  letter-spacing: 1px;
}

.title-icon {
  width: 4px;
  height: 16px;
  background: linear-gradient(180deg, #00ffff, #00b4ff);
  border-radius: 2px;
  box-shadow: 0 0 8px rgba(0, 180, 255, 0.8);
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-icon {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: color 0.3s;
}

.action-icon:hover {
  color: #00b4ff;
}

.action-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.panel-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.corner {
  position: absolute;
  width: 12px;
  height: 12px;
  border: 2px solid #00b4ff;
  pointer-events: none;
}

.corner-tl {
  top: -1px;
  left: -1px;
  border-right: none;
  border-bottom: none;
}

.corner-tr {
  top: -1px;
  right: -1px;
  border-left: none;
  border-bottom: none;
}

.corner-bl {
  bottom: -1px;
  left: -1px;
  border-right: none;
  border-top: none;
}

.corner-br {
  bottom: -1px;
  right: -1px;
  border-left: none;
  border-top: none;
}

.no-border .corner {
  display: none;
}
</style>
