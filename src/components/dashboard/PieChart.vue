<template>
  <BaseChart
    :option="chartOption"
    :loading="loading"
    :error="error"
    :empty-data="!data || !data.length"
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
    type: Array,
    default: () => []
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
    default: 'pie',
    validator: (v) => ['pie', 'ring', 'rose'].includes(v)
  },
  innerRadius: {
    type: String,
    default: '40%'
  },
  outerRadius: {
    type: String,
    default: '70%'
  },
  showLabel: {
    type: Boolean,
    default: true
  },
  colors: {
    type: Array,
    default: () => ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4']
  }
})

defineEmits(['click', 'ready'])

const chartOption = computed(() => {
  const radius = props.mode === 'pie'
    ? props.outerRadius
    : props.mode === 'rose'
      ? ['10%', props.outerRadius]
      : [props.innerRadius, props.outerRadius]

  const series = {
    type: 'pie',
    radius,
    center: ['50%', '55%'],
    roseType: props.mode === 'rose' ? 'area' : undefined,
    data: props.data,
    label: {
      show: props.showLabel,
      color: 'rgba(255,255,255,0.8)',
      fontSize: 12,
      formatter: '{b}: {d}%'
    },
    labelLine: {
      show: props.showLabel,
      lineStyle: { color: 'rgba(255,255,255,0.3)' }
    },
    itemStyle: {
      borderColor: '#0a1628',
      borderWidth: 2
    },
    emphasis: {
      itemStyle: {
        shadowBlur: 20,
        shadowColor: 'rgba(0, 180, 255, 0.5)'
      },
      label: {
        fontSize: 14,
        fontWeight: 'bold'
      }
    }
  }

  return {
    color: props.colors,
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: 'rgba(255,255,255,0.7)' },
      itemWidth: 12,
      itemHeight: 12
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    series
  }
})
</script>
