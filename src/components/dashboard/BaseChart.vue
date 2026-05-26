<template>
  <div class="base-chart-wrapper">
    <div v-if="loading" class="chart-state">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    <div v-else-if="error" class="chart-state error">
      <el-icon><WarningFilled /></el-icon>
      <span>加载失败</span>
    </div>
    <div v-else-if="isEmpty" class="chart-state empty">
      <el-icon><DataLine /></el-icon>
      <span>暂无数据</span>
    </div>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, shallowRef, nextTick, markRaw } from 'vue'
import * as echarts from 'echarts'
import { Loading, WarningFilled, DataLine } from '@element-plus/icons-vue'

const props = defineProps({
  option: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: [Error, Boolean],
    default: false
  },
  emptyData: {
    type: Boolean,
    default: false
  },
  theme: {
    type: String,
    default: 'dark'
  },
  height: {
    type: [String, Number],
    default: '100%'
  },
  width: {
    type: [String, Number],
    default: '100%'
  }
})

const emit = defineEmits(['click', 'legendselectchanged', 'brush', 'ready'])

const chartRef = ref(null)
const chartInstance = shallowRef(null)
let resizeObserver = null

const isEmpty = computed(() => {
  if (props.emptyData) return true
  if (!props.option || !props.option.series) return true
  const hasData = props.option.series.some(s => {
    if (Array.isArray(s.data)) return s.data.length > 0
    return s.data !== undefined && s.data !== null
  })
  return !hasData
})

const initChart = () => {
  if (!chartRef.value) return

  if (chartInstance.value) {
    chartInstance.value.dispose()
  }

  chartInstance.value = echarts.init(chartRef.value, props.theme)
  chartInstance.value.setOption(getMergedOption())

  chartInstance.value.on('click', (params) => {
    emit('click', params)
  })

  chartInstance.value.on('legendselectchanged', (params) => {
    emit('legendselectchanged', params)
  })

  emit('ready', chartInstance.value)

  resizeObserver = new ResizeObserver(() => {
    resize()
  })
  resizeObserver.observe(chartRef.value)
}

const getMergedOption = () => {
  const baseOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(13, 60, 84, 0.9)',
      borderColor: '#00b4ff',
      borderWidth: 1,
      textStyle: {
        color: '#fff',
        fontSize: 12
      },
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#00b4ff'
        }
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    textStyle: {
      color: 'rgba(255,255,255,0.8)'
    }
  }
  return echarts.util.merge({}, baseOption, props.option)
}

const resize = () => {
  chartInstance.value?.resize()
}

watch(() => props.option, (newOption) => {
  if (chartInstance.value && newOption) {
    nextTick(() => {
      chartInstance.value.setOption(getMergedOption(), { notMerge: false, lazyUpdate: true })
    })
  }
}, { deep: true })

watch(() => props.theme, () => {
  initChart()
})

onMounted(() => {
  nextTick(() => {
    initChart()
  })
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  if (chartInstance.value) {
    chartInstance.value.off('click')
    chartInstance.value.off('legendselectchanged')
    chartInstance.value.dispose()
    chartInstance.value = null
  }
})

defineExpose({
  getInstance: () => chartInstance.value,
  resize,
  setOption: (opt) => chartInstance.value?.setOption(opt)
})
</script>

<style scoped>
.base-chart-wrapper {
  position: relative;
  width: v-bind(width);
  height: v-bind(height);
}

.chart-container {
  width: 100%;
  height: 100%;
}

.chart-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.3);
}

.chart-state.error {
  color: #f56c6c;
}

.chart-state.empty {
  color: #909399;
}

.loading-icon {
  animation: spin 1s linear infinite;
  color: #409eff;
  font-size: 24px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
