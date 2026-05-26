<template>
  <BaseChart
    :option="chartOption"
    :loading="loading"
    :error="error"
    :empty-data="value === null || value === undefined"
    @click="$emit('click', $event)"
    @ready="$emit('ready', $event)"
    v-bind="$attrs"
  />
</template>

<script setup>
import { computed } from 'vue'
import BaseChart from './BaseChart.vue'

const props = defineProps({
  value: {
    type: [Number, Object],
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: [Error, Boolean],
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  max: {
    type: Number,
    default: 100
  },
  min: {
    type: Number,
    default: 0
  },
  unit: {
    type: String,
    default: '%'
  },
  color: {
    type: String,
    default: '#00b4ff'
  }
})

defineEmits(['click', 'ready'])

const chartOption = computed(() => {
  const actualValue = typeof props.value === 'object' ? props.value.value : props.value

  return {
    series: [
      {
        type: 'gauge',
        radius: '85%',
        center: ['50%', '60%'],
        startAngle: 200,
        endAngle: -20,
        min: props.min,
        max: props.max,
        splitNumber: 10,
        progress: {
          show: true,
          width: 12,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#00ff87' },
                { offset: 0.5, color: '#60efff' },
                { offset: 1, color: props.color }
              ]
            }
          }
        },
        axisLine: {
          lineStyle: {
            width: 12,
            color: [[1, 'rgba(255,255,255,0.1)']]
          }
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: true,
          distance: -20,
          length: 8,
          lineStyle: {
            color: 'rgba(255,255,255,0.5)',
            width: 1
          }
        },
        axisLabel: {
          show: true,
          distance: 25,
          color: 'rgba(255,255,255,0.5)',
          fontSize: 10
        },
        pointer: {
          show: true,
          length: '60%',
          width: 4,
          itemStyle: {
            color: props.color
          }
        },
        anchor: {
          show: true,
          size: 10,
          itemStyle: {
            color: props.color,
            borderColor: '#fff',
            borderWidth: 2
          }
        },
        detail: {
          valueAnimation: true,
          formatter: `{value}${props.unit}`,
          color: '#fff',
          fontSize: 20,
          fontWeight: 'bold',
          offsetCenter: [0, '25%']
        },
        title: {
          show: true,
          offsetCenter: [0, '55%'],
          color: 'rgba(255,255,255,0.7)',
          fontSize: 12
        },
        data: [
          {
            value: actualValue ?? 0,
            name: props.title
          }
        ]
      }
    ]
  }
})
</script>
