<template>
  <BaseChart
    :option="chartOption"
    :loading="loading"
    :error="error"
    :empty-data="!data || !data.series"
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
  mode: {
    type: String,
    default: 'group',
    validator: (v) => ['group', 'stack', '3d'].includes(v)
  },
  horizontal: {
    type: Boolean,
    default: false
  },
  colors: {
    type: Array,
    default: () => ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272']
  },
  gradient: {
    type: Boolean,
    default: true
  }
})

defineEmits(['click', 'ready'])

const chartOption = computed(() => {
  if (!props.data) return {}

  const series = (props.data.series || []).map((s, index) => {
    const color = props.colors[index % props.colors.length]
    const itemStyle = props.gradient
      ? {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: color + 'ff' },
              { offset: 1, color: color + '60' }
            ]
          },
          borderRadius: props.mode === 'stack' ? 0 : [4, 4, 0, 0]
        }
      : {
          color,
          borderRadius: props.mode === 'stack' ? 0 : [4, 4, 0, 0]
        }

    return {
      ...s,
      type: 'bar',
      barWidth: '40%',
      stack: props.mode === 'stack' ? (s.stack || 'total') : undefined,
      itemStyle,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: color + '80'
        }
      }
    }
  })

  const axisConfig = {
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
    axisLabel: { color: 'rgba(255,255,255,0.6)' },
    axisTick: { show: false }
  }

  return {
    color: props.colors,
    legend: {
      data: series.map(s => s.name),
      textStyle: { color: 'rgba(255,255,255,0.7)' },
      top: 0
    },
    tooltip: {
      trigger: props.mode === 'stack' ? 'axis' : 'item',
      axisPointer: { type: 'shadow' }
    },
    xAxis: props.horizontal
      ? { type: 'value', splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, ...axisConfig }
      : { type: 'category', data: props.data.xAxis || [], ...axisConfig },
    yAxis: props.horizontal
      ? { type: 'category', data: props.data.xAxis || [], ...axisConfig }
      : { type: 'value', splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, ...axisConfig },
    series
  }
})
</script>
