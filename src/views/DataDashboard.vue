<template>
  <div class="dashboard-theme">
    <div class="starfield">
      <div class="stars"></div>
    </div>
    <div class="scanline"></div>

    <div ref="screenRef" class="dashboard-container">
      <header class="dashboard-header">
        <div class="header-decoration left"></div>
        <h1 class="dashboard-title">
          <span class="title-icon">📊</span>
          企业数据可视化大屏
          <span class="title-subtitle">Enterprise Data Visualization Dashboard</span>
        </h1>
        <div class="header-decoration right"></div>

        <div class="header-controls">
          <div class="current-time">
            <el-icon><Timer /></el-icon>
            {{ currentTime }}
          </div>
          <el-tooltip content="全屏显示">
            <el-button circle size="small" @click="toggleFullscreen">
              <el-icon><component :is="isFullscreen ? 'Aim' : 'FullScreen'" /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip :content="autoPlay ? '停止轮播' : '开始轮播'">
            <el-button
              circle
              size="small"
              :type="autoPlay ? 'primary' : ''"
              @click="toggleAutoPlay"
            >
              <el-icon><component :is="autoPlay ? 'VideoPause' : 'VideoPlay'" /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="刷新数据">
            <el-button circle size="small" @click="refreshAllData">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </header>

      <div class="filter-bar" v-if="activeFilter">
        <el-tag :type="getFilterTagType(activeFilter.type)" closable @close="clearFilter">
          <span class="filter-label">{{ activeFilter.label }}:</span>
          <span class="filter-value">{{ activeFilter.value }}</span>
        </el-tag>
        <span class="filter-hint">（已应用全局过滤，点击关闭按钮取消）</span>
      </div>

      <main class="dashboard-grid">
        <section class="grid-section top-section">
          <DashboardPanel no-border class="overview-panel">
            <DigitalFlop
              :value="overviewData.totalUsers"
              label="总用户数"
              prefix="👥"
              :trend="overviewData.growthRate"
            />
          </DashboardPanel>
          <DashboardPanel no-border class="overview-panel">
            <DigitalFlop
              :value="overviewData.activeUsers"
              label="活跃用户"
              prefix="🔵"
              :trend="overviewData.conversionRate"
            />
          </DashboardPanel>
          <DashboardPanel no-border class="overview-panel">
            <DigitalFlop
              :value="overviewData.totalOrders"
              label="总订单数"
              prefix="📦"
              :trend="12.5"
            />
          </DashboardPanel>
          <DashboardPanel no-border class="overview-panel">
            <DigitalFlop
              :value="overviewData.totalRevenue"
              label="总营收"
              prefix="¥"
              suffix=""
              :trend="8.3"
            />
          </DashboardPanel>
          <DashboardPanel no-border class="overview-panel">
            <div class="realtime-indicator">
              <div class="realtime-dot" :class="{ connected: wsConnected }"></div>
              <div class="realtime-text">
                <div class="realtime-label">实时订单</div>
                <div class="realtime-value">{{ realtimeData.realtimeOrders }}</div>
              </div>
            </div>
          </DashboardPanel>
          <DashboardPanel no-border class="overview-panel">
            <div class="realtime-indicator">
              <div class="realtime-dot" :class="{ connected: wsConnected }"></div>
              <div class="realtime-text">
                <div class="realtime-label">实时营收</div>
                <div class="realtime-value">¥{{ realtimeData.realtimeRevenue.toLocaleString() }}</div>
              </div>
            </div>
          </DashboardPanel>
        </section>

        <section class="grid-section middle-section">
          <div class="col col-3">
            <DashboardPanel title="📈 销售趋势分析" :loading="trendLoading" @refresh="loadTrendData">
              <template #actions>
                <el-radio-group v-model="chartType" size="small" @change="handleChartTypeChange">
                  <el-radio-button value="line">折线</el-radio-button>
                  <el-radio-button value="bar">柱状</el-radio-button>
                </el-radio-group>
              </template>
              <LineChart
                v-if="chartType === 'line'"
                :data="trendData"
                :loading="trendLoading"
                :error="trendError"
                :show-area="true"
                :gradient="true"
                @click="handleChartClick('trend', $event)"
                style="height: 100%"
              />
              <BarChart
                v-else
                :data="trendData"
                :loading="trendLoading"
                :error="trendError"
                mode="group"
                :gradient="true"
                @click="handleChartClick('trend', $event)"
                style="height: 100%"
              />
            </DashboardPanel>
          </div>

          <div class="col col-4">
            <DashboardPanel title="🗺️ 区域数据分布" :loading="mapLoading" @refresh="loadMapData">
              <template #actions>
                <el-button size="small" @click="mapLevel = 'country'; loadMapData()">全国</el-button>
                <el-button size="small" @click="mapLevel = 'province'; loadMapData()">省份</el-button>
              </template>
              <MapChart
                ref="mapChartRef"
                :data="mapData"
                :loading="mapLoading"
                :error="mapError"
                :level="mapLevel"
                @click="handleChartClick('map', $event)"
                @drill="handleMapDrill"
                style="height: 100%"
              />
            </DashboardPanel>
          </div>

          <div class="col col-3">
            <DashboardPanel title="📊 区域销售对比" :loading="barLoading" @refresh="loadBarData">
              <template #actions>
                <el-radio-group v-model="barMode" size="small">
                  <el-radio-button value="stack">堆叠</el-radio-button>
                  <el-radio-button value="group">分组</el-radio-button>
                </el-radio-group>
              </template>
              <BarChart
                :data="barData"
                :loading="barLoading"
                :error="barError"
                :mode="barMode"
                :gradient="true"
                @click="handleChartClick('bar', $event)"
                style="height: 100%"
              />
            </DashboardPanel>
          </div>
        </section>

        <section class="grid-section bottom-section">
          <div class="col col-2">
            <DashboardPanel title="🥧 品类占比分析" :loading="pieLoading" @refresh="loadPieData">
              <template #actions>
                <el-radio-group v-model="pieMode" size="small">
                  <el-radio-button value="pie">饼图</el-radio-button>
                  <el-radio-button value="ring">环形</el-radio-button>
                  <el-radio-button value="rose">玫瑰</el-radio-button>
                </el-radio-group>
              </template>
              <PieChart
                :data="pieData"
                :loading="pieLoading"
                :error="pieError"
                :mode="pieMode"
                @click="handleChartClick('pie', $event)"
                style="height: 100%"
              />
            </DashboardPanel>
          </div>

          <div class="col col-2">
            <DashboardPanel title="🎯 能力雷达分析" :loading="radarLoading" @refresh="loadRadarData">
              <RadarChart
                :data="radarData"
                :loading="radarLoading"
                :error="radarError"
                @click="handleChartClick('radar', $event)"
                style="height: 100%"
              />
            </DashboardPanel>
          </div>

          <div class="col col-2">
            <DashboardPanel title="⚡ 系统性能监控" :loading="gaugeLoading" @refresh="loadGaugeData">
              <div class="gauge-grid">
                <div class="gauge-item">
                  <GaugeChart
                    :value="gaugeData.cpu"
                    title="CPU使用率"
                    unit="%"
                    color="#00b4ff"
                    :loading="gaugeLoading"
                    :error="gaugeError"
                  />
                </div>
                <div class="gauge-item">
                  <GaugeChart
                    :value="gaugeData.memory"
                    title="内存使用率"
                    unit="%"
                    color="#91cc75"
                    :loading="gaugeLoading"
                    :error="gaugeError"
                  />
                </div>
              </div>
            </DashboardPanel>
          </div>

          <div class="col col-2">
            <DashboardPanel title="📋 目标完成进度" :loading="progressLoading" @refresh="loadProgressData">
              <ProgressBar
                :data="progressData"
                style="height: 100%"
              />
            </DashboardPanel>
          </div>

          <div class="col col-4">
            <DashboardPanel title="🔔 实时告警中心" :loading="alertLoading" @refresh="loadAlertData">
              <AlertList
                :data="alertData"
                style="height: 100%"
              />
            </DashboardPanel>
          </div>
        </section>
      </main>

      <el-dialog
        v-model="drillDialogVisible"
        title="数据下钻详情"
        width="800px"
        class="drill-dialog"
      >
        <div class="drill-content">
          <h4>{{ drillInfo.name }} 详细数据</h4>
          <p>级别: {{ drillInfo.level }}</p>
          <p>区域代码: {{ drillInfo.code }}</p>
          <LineChart
            v-if="drillDetailData"
            :data="drillDetailData"
            style="height: 300px"
          />
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Timer, FullScreen, Aim, VideoPlay, VideoPause, Refresh
} from '@element-plus/icons-vue'
import {
  LineChart, BarChart, PieChart, RadarChart, GaugeChart,
  MapChart, DigitalFlop, ProgressBar, AlertList, DashboardPanel
} from '@/components/dashboard'
import { useScreenAdapter } from '@/utils/screenAdapter'
import { mockApi, createWebSocketMock, debounce } from '@/utils/mockData'
import { useDataPolling } from '@/utils/dataPolling'
import '@/styles/dashboard.css'

const screenRef = ref(null)
const { initAdapter, destroyAdapter, toggleFullscreen: toggleFs } = useScreenAdapter(screenRef)

const isFullscreen = ref(false)
const currentTime = ref('')
let timeInterval = null

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

const toggleFullscreen = async () => {
  await toggleFs()
  isFullscreen.value = !!document.fullscreenElement
}

const autoPlay = ref(false)
let autoPlayInterval = null
const carouselItems = ['trend', 'map', 'bar', 'pie', 'radar']
let carouselIndex = 0

const toggleAutoPlay = () => {
  autoPlay.value = !autoPlay.value
  if (autoPlay.value) {
    autoPlayInterval = setInterval(() => {
      carouselIndex = (carouselIndex + 1) % carouselItems.length
      const item = carouselItems[carouselIndex]
      ElMessage.info(`轮播切换到: ${getChartName(item)}`)
    }, 5000)
  } else {
    if (autoPlayInterval) clearInterval(autoPlayInterval)
  }
}

const getChartName = (key) => {
  const names = {
    trend: '销售趋势',
    map: '区域分布',
    bar: '区域对比',
    pie: '品类占比',
    radar: '能力分析'
  }
  return names[key] || key
}

const activeFilter = ref(null)

const getFilterTagType = (type) => {
  const types = {
    trend: '',
    map: 'primary',
    bar: 'success',
    pie: 'warning',
    radar: 'info'
  }
  return types[type] || ''
}

const clearFilter = () => {
  activeFilter.value = null
  ElMessage.success('已清除全局过滤')
}

const handleChartClick = (source, params) => {
  console.log(`[${source}] Chart clicked:`, params)

  const value = params.name || params.data?.name || params.value
  activeFilter.value = {
    type: source,
    label: getChartName(source),
    value: value,
    params
  }

  ElMessage.success(`已应用过滤: ${getChartName(source)} → ${value}`)
}

const handleChartTypeChange = () => {
  // 触发重新渲染
}

const mapChartRef = ref(null)
const mapLevel = ref('country')
const drillDialogVisible = ref(false)
const drillInfo = reactive({ name: '', level: '', code: '' })
const drillDetailData = ref(null)

const handleMapDrill = async (info) => {
  console.log('Map drill:', info)
  drillInfo.name = info.name
  drillInfo.level = info.level
  drillInfo.code = info.code

  if (info.level === 'city') {
    drillDetailData.value = await mockApi.getTrendData()
    drillDialogVisible.value = true
  }

  loadMapData(info.level, info.code)
}

const chartType = ref('line')
const barMode = ref('stack')
const pieMode = ref('ring')

const overviewData = reactive({
  totalUsers: 0,
  activeUsers: 0,
  totalOrders: 0,
  totalRevenue: 0,
  growthRate: 0,
  conversionRate: 0
})

const realtimeData = reactive({
  realtimeOrders: 0,
  realtimeRevenue: 0,
  activeUsers: 0
})
const wsConnected = ref(false)

const { data: trendData, loading: trendLoading, error: trendError, fetchData: loadTrendData, start: startTrendPolling, stop: stopTrendPolling } =
  useDataPolling(() => mockApi.getTrendData(), 10000, { immediate: false, initialValue: [] })

const { data: barData, loading: barLoading, error: barError, fetchData: loadBarData, start: startBarPolling, stop: stopBarPolling } =
  useDataPolling(() => mockApi.getBarData(), 15000, { immediate: false, initialValue: [] })

const { data: pieData, loading: pieLoading, error: pieError, fetchData: loadPieData, start: startPiePolling, stop: stopPiePolling } =
  useDataPolling(() => mockApi.getPieData(), 20000, { immediate: false, initialValue: [] })

const { data: radarData, loading: radarLoading, error: radarError, fetchData: loadRadarData, start: startRadarPolling, stop: stopRadarPolling } =
  useDataPolling(() => mockApi.getRadarData(), 25000, { immediate: false, initialValue: [] })

const { data: gaugeData, loading: gaugeLoading, error: gaugeError, fetchData: loadGaugeData, start: startGaugePolling, stop: stopGaugePolling } =
  useDataPolling(() => mockApi.getGaugeData(), 5000, { immediate: false, initialValue: { cpu: 0, memory: 0 } })

const { data: progressData, loading: progressLoading, fetchData: loadProgressData, start: startProgressPolling, stop: stopProgressPolling } =
  useDataPolling(() => mockApi.getProgressData(), 12000, { immediate: false, initialValue: [] })

const { data: alertData, loading: alertLoading, fetchData: loadAlertData, start: startAlertPolling, stop: stopAlertPolling } =
  useDataPolling(() => mockApi.getAlertList(), 8000, { immediate: false, initialValue: [] })

const mapData = ref([])
const mapLoading = ref(false)
const mapError = ref(null)

const loadMapData = async (level = mapLevel.value, code = '100000') => {
  mapLoading.value = true
  mapError.value = null
  try {
    mapData.value = await mockApi.getMapData(level, code)
  } catch (e) {
    mapError.value = e
  } finally {
    mapLoading.value = false
  }
}

const loadOverviewData = async () => {
  const data = await mockApi.getOverview()
  Object.assign(overviewData, data)
}

const refreshAllData = async () => {
  ElMessage.info('正在刷新所有数据...')
  try {
    await Promise.all([
      loadOverviewData(),
      loadTrendData(),
      loadBarData(),
      loadPieData(),
      loadRadarData(),
      loadGaugeData(),
      loadProgressData(),
      loadAlertData(),
      loadMapData()
    ])
    ElMessage.success('数据刷新完成')
  } catch (e) {
    ElMessage.error('数据刷新失败')
  }
}

let wsMock = null

const initWebSocket = () => {
  wsMock = createWebSocketMock()
  wsMock.subscribe((data) => {
    Object.assign(realtimeData, data)
    wsConnected.value = true
  })
  wsMock.connect()
}

const debouncedResize = debounce(() => {
  // 可选：触发图表重新调整
}, 200)

watch(isFullscreen, () => {
  debouncedResize()
})

onMounted(async () => {
  initAdapter()
  updateTime()
  timeInterval = setInterval(updateTime, 1000)

  await loadOverviewData()
  await Promise.all([
    loadTrendData(),
    loadBarData(),
    loadPieData(),
    loadRadarData(),
    loadGaugeData(),
    loadProgressData(),
    loadAlertData(),
    loadMapData()
  ])

  startTrendPolling()
  startBarPolling()
  startPiePolling()
  startRadarPolling()
  startGaugePolling()
  startProgressPolling()
  startAlertPolling()

  initWebSocket()

  window.addEventListener('resize', debouncedResize)
})

onUnmounted(() => {
  destroyAdapter()
  if (timeInterval) clearInterval(timeInterval)
  if (autoPlayInterval) clearInterval(autoPlayInterval)

  stopTrendPolling()
  stopBarPolling()
  stopPiePolling()
  stopRadarPolling()
  stopGaugePolling()
  stopProgressPolling()
  stopAlertPolling()

  if (wsMock) wsMock.disconnect()

  window.removeEventListener('resize', debouncedResize)
})
</script>

<style scoped>
.dashboard-container {
  position: relative;
  width: 1920px;
  height: 1080px;
  padding: 20px 30px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
  font-family: var(--font-family);
  color: var(--text-primary);
}

.dashboard-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 70px;
  flex-shrink: 0;
}

.header-decoration {
  position: absolute;
  top: 50%;
  width: 300px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
  transform: translateY(-50%);
}

.header-decoration.left {
  left: 150px;
}

.header-decoration.right {
  right: 200px;
  transform: translateY(-50%) scaleX(-1);
}

.dashboard-title {
  font-size: 32px;
  font-weight: bold;
  color: var(--secondary-color);
  text-shadow: 0 0 20px rgba(0, 255, 255, 0.8), 0 0 40px rgba(0, 180, 255, 0.5);
  letter-spacing: 4px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 36px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.title-subtitle {
  font-size: 12px;
  color: var(--text-tertiary);
  letter-spacing: 2px;
  font-weight: normal;
  text-shadow: none;
  align-self: flex-end;
  margin-bottom: 4px;
}

.header-controls {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
}

.current-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--secondary-color);
  font-family: var(--font-family-digital);
  padding: 6px 12px;
  background: rgba(0, 180, 255, 0.1);
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(0, 180, 255, 0.05);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  flex-shrink: 0;
}

.filter-label {
  color: var(--text-secondary);
  margin-right: 4px;
}

.filter-value {
  font-weight: bold;
  color: var(--primary-color);
}

.filter-hint {
  font-size: 12px;
  color: var(--text-tertiary);
}

.dashboard-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.grid-section {
  display: flex;
  gap: 16px;
  min-height: 0;
}

.top-section {
  height: 120px;
  flex-shrink: 0;
}

.middle-section {
  flex: 1;
  min-height: 0;
}

.bottom-section {
  height: 320px;
  flex-shrink: 0;
}

.col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.col-2 { flex: 2; }
.col-3 { flex: 3; }
.col-4 { flex: 4; }

.overview-panel {
  height: 100%;
}

.realtime-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  height: 100%;
  justify-content: center;
}

.realtime-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--danger-color);
  box-shadow: 0 0 10px var(--danger-color);
  animation: blink 1s ease-in-out infinite;
}

.realtime-dot.connected {
  background: var(--success-color);
  box-shadow: 0 0 10px var(--success-color);
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.realtime-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.realtime-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.realtime-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--secondary-color);
  font-family: var(--font-family-digital);
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}

.gauge-grid {
  display: flex;
  height: 100%;
}

.gauge-item {
  flex: 1;
  height: 100%;
}

.drill-content {
  padding: 20px 0;
}

.drill-content h4 {
  color: var(--primary-color);
  margin: 0 0 10px 0;
}

.drill-content p {
  color: var(--text-secondary);
  margin: 5px 0;
}

:deep(.drill-dialog .el-dialog__header) {
  background: var(--bg-dark);
  border-bottom: 1px solid var(--border-color);
}

:deep(.drill-dialog .el-dialog__title) {
  color: var(--primary-color);
}

:deep(.drill-dialog .el-dialog__body) {
  background: var(--bg-darker);
  color: var(--text-primary);
}
</style>
