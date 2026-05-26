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
  smooth: {
    type: Boolean,
    default: true
  },
  showArea: {
    type: Boolean,
    default: false
  },
  gradient: {
    type: Boolean,
    default: true
  },
  colors: {
    type: Array,
    default: () => ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272']
  }
})

defineEmits(['click', 'ready'])

const chartOption = computed(() => {
  if (!props.data) return {}

  const series = (props.data.series || []).map((s, index) => {
    const color = props.colors[index % props.colors.length]
    const seriesItem = {
      ...s,
      type: 'line',
      smooth: props.smooth,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        width: 2,
        color
      },
      itemStyle: {
        color
      }
    }

    if (props.showArea) {
      seriesItem.areaStyle = {
        color: props.gradient
          ? {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: color + '80' },
                { offset: 1, color: color + '00' }
              ]
            }
          : color + '40'
      }
    }

    return seriesItem
  })

  return {
    color: props.colors,
    legend: {
      data: series.map(s => s.name),
      textStyle: { color: 'rgba(255,255,255,0.7)' },
      top: 0
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.data.xAxis || [],
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
      axisLabel: { color: 'rgba(255,255,255,0.6)' },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisLine: { show: false },
      axisLabel: { color: 'rgba(255,255,255,0.6)' },
      axisTick: { show: false }
    },
    series
  }
})
</script>
