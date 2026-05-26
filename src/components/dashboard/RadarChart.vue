<template>
  <BaseChart
    :option="chartOption"
    :loading="loading"
    :error="error"
    :empty-data="!data || !data.indicator"
    @click="$emit('click', $event)"
    @ready="$emit('ready', $event)"
    v-bind="$attrs"
  />
</template>

<script setup>
import { computed } from 'vue'
import BaseChart from './BaseChart.vue'

const props = defineProps({
  data: {
    type: Object,
    default: () => null
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: [Error, Boolean],
    default: false
  },
  colors: {
    type: Array,
    default: () => ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de']
  }
})

defineEmits(['click', 'ready'])

const chartOption = computed(() => {
  if (!props.data) return {}

  const series = (props.data.series || []).map((s, index) => {
    const color = props.colors[index % props.colors.length]
    return {
      ...s,
      type: 'radar',
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        width: 2,
        color
      },
      itemStyle: {
        color
      },
      areaStyle: {
        color: {
          type: 'radial',
          x: 0.5, y: 0.5, r: 0.5,
          colorStops: [
            { offset: 0, color: color + '80' },
            { offset: 1, color: color + '20' }
          ]
        }
      }
    }
  })

  return {
    color: props.colors,
    legend: {
      data: series.map(s => s.name),
      textStyle: { color: 'rgba(255,255,255,0.7)' },
      bottom: 10
    },
    tooltip: {
      trigger: 'item'
    },
    radar: {
      indicator: props.data.indicator,
      shape: 'polygon',
      splitNumber: 4,
      axisName: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12
      },
      splitLine: {
        lineStyle: { color: 'rgba(255,255,255,0.2)' }
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(0, 180, 255, 0.05)', 'rgba(0, 180, 255, 0.1)']
        }
      },
      axisLine: {
        lineStyle: { color: 'rgba(255,255,255,0.2)' }
      }
    },
    series
  }
})
</script>
