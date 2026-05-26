<template>
  <div class="progress-container">
    <div v-for="item in data" :key="item.name" class="progress-item">
      <div class="progress-header">
        <span class="progress-name">{{ item.name }}</span>
        <span class="progress-value">{{ item.value }}/{{ item.total }}</span>
      </div>
      <div class="progress-track">
        <div
          class="progress-fill"
          :style="{
            width: `${(item.value / item.total) * 100}%`,
            background: getGradient(item.value / item.total)
          }"
        >
          <div class="progress-shine"></div>
        </div>
      </div>
      <div class="progress-percent">{{ ((item.value / item.total) * 100).toFixed(1) }}%</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  data: {
    type: Array,
    default: () => []
  }
})

const getGradient = (ratio) => {
  if (ratio >= 0.9) {
    return 'linear-gradient(90deg, #f56c6c, #ff6b6b)'
  } else if (ratio >= 0.7) {
    return 'linear-gradient(90deg, #e6a23c, #ff9500)'
  }
  return 'linear-gradient(90deg, #00b4ff, #00ffff)'
}
</script>

<style scoped>
.progress-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.progress-name {
  color: rgba(255, 255, 255, 0.9);
}

.progress-value {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.progress-track {
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(0, 180, 255, 0.2);
}

.progress-fill {
  height: 100%;
  border-radius: 6px;
  position: relative;
  transition: width 0.8s ease-out;
  box-shadow: 0 0 10px rgba(0, 180, 255, 0.5);
}

.progress-shine {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  animation: shine 2s infinite;
}

@keyframes shine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-percent {
  font-size: 12px;
  color: #00ffff;
  text-align: right;
  font-weight: bold;
}
</style>
