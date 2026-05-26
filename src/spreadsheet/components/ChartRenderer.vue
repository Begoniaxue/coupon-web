<template>
  <div 
    class="chart-container"
    :style="{
      position: 'absolute',
      left: chart.position.x + 'px',
      top: chart.position.y + 'px',
      width: chart.size.width + 'px',
      height: chart.size.height + 'px'
    }"
  >
    <div class="chart-header">
      <span class="chart-title">{{ chart.title }}</span>
      <button class="close-btn" @click="$emit('close', chart.id)">×</button>
    </div>
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { ChartConfig, CellData } from '../types'
import { CELL_KEY } from '../utils/cellUtils'

const props = defineProps<{
  chart: ChartConfig
  cells: Map<string, CellData>
}>()

defineEmits<{
  (e: 'close', id: string): void
}>()

const chartCanvas = ref<HTMLCanvasElement | null>(null)

const getChartData = () => {
  const { start, end } = props.chart.dataRange
  const labels: string[] = []
  const values: number[] = []

  for (let r = start.row; r <= end.row; r++) {
    const labelCell = props.cells.get(CELL_KEY(r, start.col))
    const valueCell = props.cells.get(CELL_KEY(r, end.col))
    
    if (labelCell?.value !== null && labelCell?.value !== undefined) {
      labels.push(String(labelCell.value))
    }
    
    const numValue = Number(valueCell?.value)
    values.push(isNaN(numValue) ? 0 : numValue)
  }

  return { labels, values }
}

const renderChart = () => {
  if (!chartCanvas.value) return
  
  const ctx = chartCanvas.value.getContext('2d')!
  const { width, height } = chartCanvas.value
  const dpr = window.devicePixelRatio || 1
  
  chartCanvas.value.width = width * dpr
  chartCanvas.value.height = height * dpr
  ctx.scale(dpr, dpr)
  chartCanvas.value.style.width = `${width}px`
  chartCanvas.value.style.height = `${height}px`
  
  ctx.clearRect(0, 0, width, height)
  
  const { labels, values } = getChartData()
  if (values.length === 0) return
  
  const padding = { top: 30, right: 20, bottom: 40, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ]
  
  switch (props.chart.type) {
    case 'bar':
      renderBarChart(ctx, labels, values, padding, chartWidth, chartHeight, colors)
      break
    case 'line':
      renderLineChart(ctx, labels, values, padding, chartWidth, chartHeight)
      break
    case 'pie':
      renderPieChart(ctx, labels, values, width, height, colors)
      break
  }
}

const renderBarChart = (
  ctx: CanvasRenderingContext2D,
  labels: string[],
  values: number[],
  padding: any,
  chartWidth: number,
  chartHeight: number,
  colors: string[]
) => {
  const maxValue = Math.max(...values, 1)
  const barWidth = chartWidth / values.length * 0.7
  const barGap = chartWidth / values.length * 0.3
  
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(padding.left + chartWidth, y)
    ctx.stroke()
    
    ctx.fillStyle = '#6b7280'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'right'
    const value = Math.round(maxValue - (maxValue / 4) * i)
    ctx.fillText(String(value), padding.left - 5, y + 4)
  }
  
  values.forEach((value, index) => {
    const x = padding.left + index * (barWidth + barGap) + barGap / 2
    const barHeight = (value / maxValue) * chartHeight
    const y = padding.top + chartHeight - barHeight
    
    const gradient = ctx.createLinearGradient(x, y, x, y + barHeight)
    gradient.addColorStop(0, colors[index % colors.length])
    gradient.addColorStop(1, colors[index % colors.length] + '88')
    
    ctx.fillStyle = gradient
    ctx.fillRect(x, y, barWidth, barHeight)
    
    ctx.fillStyle = '#374151'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    const label = labels[index]?.slice(0, 6) || ''
    ctx.fillText(label, x + barWidth / 2, padding.top + chartHeight + 20)
  })
}

const renderLineChart = (
  ctx: CanvasRenderingContext2D,
  labels: string[],
  values: number[],
  padding: any,
  chartWidth: number,
  chartHeight: number
) => {
  const maxValue = Math.max(...values, 1)
  const pointSpacing = chartWidth / (values.length - 1 || 1)
  
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(padding.left + chartWidth, y)
    ctx.stroke()
    
    ctx.fillStyle = '#6b7280'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'right'
    const value = Math.round(maxValue - (maxValue / 4) * i)
    ctx.fillText(String(value), padding.left - 5, y + 4)
  }
  
  ctx.beginPath()
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2
  
  const points = values.map((value, index) => ({
    x: padding.left + index * pointSpacing,
    y: padding.top + chartHeight - (value / maxValue) * chartHeight
  }))
  
  if (points.length > 0) {
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.stroke()
    
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
    ctx.beginPath()
    ctx.moveTo(points[0].x, padding.top + chartHeight)
    for (const point of points) {
      ctx.lineTo(point.x, point.y)
    }
    ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight)
    ctx.closePath()
    ctx.fill()
  }
  
  points.forEach((point, index) => {
    ctx.fillStyle = '#3b82f6'
    ctx.beginPath()
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(point.x, point.y, 2, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#374151'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    const label = labels[index]?.slice(0, 6) || ''
    ctx.fillText(label, point.x, padding.top + chartHeight + 20)
  })
}

const renderPieChart = (
  ctx: CanvasRenderingContext2D,
  labels: string[],
  values: number[],
  width: number,
  height: number,
  colors: string[]
) => {
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) / 2 - 30
  
  const total = values.reduce((sum, v) => sum + v, 0) || 1
  let currentAngle = -Math.PI / 2
  
  values.forEach((value, index) => {
    const sliceAngle = (value / total) * Math.PI * 2
    
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
    ctx.closePath()
    ctx.fillStyle = colors[index % colors.length]
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()
    
    const midAngle = currentAngle + sliceAngle / 2
    const labelX = centerX + Math.cos(midAngle) * (radius + 20)
    const labelY = centerY + Math.sin(midAngle) * (radius + 20)
    
    ctx.fillStyle = '#374151'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    const percentage = ((value / total) * 100).toFixed(1)
    ctx.fillText(`${labels[index]?.slice(0, 4) || ''} ${percentage}%`, labelX, labelY)
    
    currentAngle += sliceAngle
  })
}

onMounted(() => {
  renderChart()
})

watch(() => [props.chart, props.cells], () => {
  renderChart()
}, { deep: true })
</script>

<style scoped>
.chart-container {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 10;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.chart-title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #6b7280;
  padding: 0 4px;
  line-height: 1;
}

.close-btn:hover {
  color: #ef4444;
}

canvas {
  display: block;
}
</style>
