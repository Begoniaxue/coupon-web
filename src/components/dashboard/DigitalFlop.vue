<template>
  <div class="digital-flop">
    <div class="flop-label">{{ label }}</div>
    <div class="flop-value">
      <div v-if="prefix" class="flop-prefix">{{ prefix }}</div>
      <div class="flop-digits">
        <div
          v-for="(digit, index) in displayDigits"
          :key="index"
          class="digit-wrapper"
        >
          <div
            v-if="digit === ',' || digit === '.' "
            class="digit-separator"
          >{{ digit }}</div>
          <div v-else class="digit-box">
            <div
              class="digit-roller"
              :style="{ transform: `translateY(-${digit * 10}%)`, transitionDuration: `${transitionDuration}s` }"
            >
              <div v-for="n in 10" :key="n" class="digit">{{ n - 1 }}</div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="suffix" class="flop-suffix">{{ suffix }}</div>
    </div>
    <div v-if="trend !== undefined" class="flop-trend" :class="trendClass">
      <el-icon><component :is="trendIcon" /></el-icon>
      <span>{{ Math.abs(trend) }}%</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { Top, Bottom } from '@element-plus/icons-vue'

const props = defineProps({
  value: {
    type: Number,
    default: 0
  },
  label: {
    type: String,
    default: ''
  },
  prefix: {
    type: String,
    default: ''
  },
  suffix: {
    type: String,
    default: ''
  },
  trend: {
    type: Number,
    default: undefined
  },
  decimals: {
    type: Number,
    default: 0
  },
  separator: {
    type: Boolean,
    default: true
  },
  transitionDuration: {
    type: Number,
    default: 0.8
  }
})

const currentValue = ref(0)

const displayDigits = computed(() => {
  let str = currentValue.value.toFixed(props.decimals)
  if (props.separator) {
    const parts = str.split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    str = parts.join('.')
  }
  return str.split('')
})

const trendClass = computed(() => {
  if (props.trend === undefined) return ''
  return props.trend >= 0 ? 'up' : 'down'
})

const trendIcon = computed(() => {
  return props.trend >= 0 ? Top : Bottom
})

const animateValue = (start, end, duration = 1000) => {
  const startTime = performance.now()
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easeProgress = 1 - Math.pow(1 - progress, 3)
    currentValue.value = Math.floor(start + (end - start) * easeProgress)
    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      currentValue.value = end
    }
  }
  requestAnimationFrame(animate)
}

watch(() => props.value, (newVal, oldVal) => {
  animateValue(oldVal || 0, newVal)
}, { immediate: false })

onMounted(() => {
  animateValue(0, props.value)
})
</script>

<style scoped>
.digital-flop {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
}

.flop-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 1px;
}

.flop-value {
  display: flex;
  align-items: center;
  gap: 4px;
}

.flop-prefix,
.flop-suffix {
  font-size: 20px;
  color: #00b4ff;
  font-weight: bold;
}

.flop-digits {
  display: flex;
  gap: 2px;
}

.digit-wrapper {
  display: flex;
  align-items: center;
}

.digit-separator {
  font-size: 32px;
  font-weight: bold;
  color: #00b4ff;
  padding: 0 2px;
}

.digit-box {
  width: 28px;
  height: 44px;
  background: linear-gradient(180deg, #0a3d5c 0%, #051f2e 100%);
  border: 1px solid #00b4ff;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 0 10px rgba(0, 180, 255, 0.3), inset 0 0 10px rgba(0, 180, 255, 0.1);
}

.digit-box::before,
.digit-box::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1;
}

.digit-box::before {
  top: 50%;
}

.digit-box::after {
  bottom: 0;
}

.digit-roller {
  transition: transform ease-out;
}

.digit {
  height: 44px;
  line-height: 44px;
  text-align: center;
  font-size: 28px;
  font-weight: bold;
  color: #00ffff;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
  font-family: 'DS-Digital', 'Monaco', 'Consolas', monospace;
}

.flop-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.flop-trend.up {
  color: #67c23a;
  background: rgba(103, 194, 58, 0.1);
}

.flop-trend.down {
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.1);
}
</style>
