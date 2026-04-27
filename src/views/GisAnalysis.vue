<template>
  <div class="gis-analysis">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="analysis-tools-card">
          <template #header>
            <span>空间分析工具</span>
          </template>
          
          <el-tabs v-model="activeTab">
            <el-tab-pane label="缓冲区分析" name="buffer">
              <el-form :model="bufferForm" label-width="100px">
                <el-form-item label="中心点">
                  <el-select
                    v-model="bufferForm.centerName"
                    placeholder="请选择中心点"
                    filterable
                    style="width: 100%"
                    @change="handleSelectCenter"
                  >
                    <el-option
                      v-for="loc in gisStore.locationList"
                      :key="loc.id"
                      :label="loc.name"
                      :value="loc.name"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="缓冲半径">
                  <el-slider
                    v-model="bufferForm.radius"
                    :min="100"
                    :max="10000"
                    :step="100"
                    show-input
                    :format-tooltip="formatRadius"
                  />
                </el-form-item>
                <el-form-item label="单位">
                  <el-radio-group v-model="bufferForm.unit">
                    <el-radio value="meters">米</el-radio>
                    <el-radio value="kilometers">千米</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="填充颜色">
                  <el-color-picker v-model="bufferForm.color" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="createBufferZone" :loading="gisStore.loading">
                    <el-icon><Plus /></el-icon>
                    创建缓冲区
                  </el-button>
                  <el-button @click="clearBufferZones">
                    <el-icon><Delete /></el-icon>
                    清除
                  </el-button>
                </el-form-item>
              </el-form>
              
              <el-divider content-position="left">已创建的缓冲区</el-divider>
              <div class="buffer-list">
                <div
                  v-for="zone in gisStore.bufferZones"
                  :key="zone.id"
                  class="buffer-item"
                >
                  <div class="buffer-info">
                    <div class="buffer-name">{{ zone.name }}</div>
                    <div class="buffer-detail">
                      半径: {{ zone.radius }}米 | 面积: {{ zone.area }}
                    </div>
                  </div>
                  <div class="buffer-actions">
                    <el-button type="primary" link size="small" @click="focusBuffer(zone)">
                      定位
                    </el-button>
                    <el-button type="danger" link size="small" @click="removeBuffer(zone)">
                      删除
                    </el-button>
                  </div>
                </div>
                <el-empty v-if="gisStore.bufferZones.length === 0" description="暂无缓冲区" />
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="热力图分析" name="heatmap">
              <el-form :model="heatmapForm" label-width="100px">
                <el-form-item label="数据类型">
                  <el-select v-model="heatmapForm.dataType" style="width: 100%">
                    <el-option label="人流量" value="population" />
                    <el-option label="商业密度" value="business" />
                    <el-option label="交通流量" value="traffic" />
                  </el-select>
                </el-form-item>
                <el-form-item label="半径">
                  <el-slider
                    v-model="heatmapForm.radius"
                    :min="10"
                    :max="100"
                    show-input
                  />
                </el-form-item>
                <el-form-item label="透明度">
                  <el-slider
                    v-model="heatmapForm.opacity"
                    :min="0.1"
                    :max="1"
                    :step="0.1"
                    show-input
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="generateHeatmap" :loading="gisStore.loading">
                    <el-icon><Refresh /></el-icon>
                    生成热力图
                  </el-button>
                  <el-button @click="clearHeatmap">
                    <el-icon><Delete /></el-icon>
                    清除
                  </el-button>
                </el-form-item>
              </el-form>
              
              <el-divider content-position="left">热力图数据</el-divider>
              <el-table :data="heatmapDataList" size="small">
                <el-table-column prop="lat" label="纬度" width="100" />
                <el-table-column prop="lng" label="经度" width="100" />
                <el-table-column prop="intensity" label="强度">
                  <template #default="{ row }">
                    <el-progress 
                      :percentage="Math.round(row.intensity * 100)" 
                      :color="getHeatmapColor(row.intensity)"
                      :stroke-width="10"
                    />
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
            
            <el-tab-pane label="叠加分析" name="overlay">
              <el-form :model="overlayForm" label-width="100px">
                <el-form-item label="图层A">
                  <el-select v-model="overlayForm.layerA" style="width: 100%">
                    <el-option label="商业区" value="business" />
                    <el-option label="住宅区" value="residential" />
                    <el-option label="交通区" value="transport" />
                  </el-select>
                </el-form-item>
                <el-form-item label="图层B">
                  <el-select v-model="overlayForm.layerB" style="width: 100%">
                    <el-option label="绿地" value="green" />
                    <el-option label="水域" value="water" />
                    <el-option label="道路" value="road" />
                  </el-select>
                </el-form-item>
                <el-form-item label="分析类型">
                  <el-radio-group v-model="overlayForm.operation">
                    <el-radio value="intersect">交集</el-radio>
                    <el-radio value="union">并集</el-radio>
                    <el-radio value="difference">差集</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="executeOverlayAnalysis" :loading="overlayLoading">
                    <el-icon><DataAnalysis /></el-icon>
                    执行分析
                  </el-button>
                </el-form-item>
              </el-form>
              
              <el-divider content-position="left">分析结果</el-divider>
              <div v-if="overlayResult" class="overlay-result">
                <el-descriptions :column="1" border size="small">
                  <el-descriptions-item label="分析类型">
                    {{ getOperationLabel(overlayForm.operation) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="参与图层">
                    图层A: {{ overlayForm.layerA }} | 图层B: {{ overlayForm.layerB }}
                  </el-descriptions-item>
                  <el-descriptions-item label="结果面积">
                    {{ overlayResult.area }} 平方公里
                  </el-descriptions-item>
                  <el-descriptions-item label="几何数量">
                    {{ overlayResult.featureCount }} 个
                  </el-descriptions-item>
                </el-descriptions>
              </div>
              <el-empty v-else description="请执行叠加分析" />
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card class="map-card">
          <template #header>
            <div class="card-header">
              <span>分析视图</span>
              <div class="layer-controls">
                <el-checkbox v-model="showPoints" :true-label="1" :false-label="0">显示标记点</el-checkbox>
                <el-checkbox v-model="showBuffers" :true-label="1" :false-label="0">显示缓冲区</el-checkbox>
                <el-checkbox v-model="showHeatmap" :true-label="1" :false-label="0">显示热力图</el-checkbox>
              </div>
            </div>
          </template>
          <div ref="mapContainer" class="map-container">
            <div v-if="mapLoading" class="map-loading">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>加载地图中...</span>
            </div>
          </div>
        </el-card>

        <el-card class="statistics-card" style="margin-top: 20px;">
          <template #header>
            <span>分析统计</span>
          </template>
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-value">{{ gisStore.bufferZones.length }}</div>
                <div class="stat-label">缓冲区数量</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-value">{{ totalBufferArea.toFixed(2) }}</div>
                <div class="stat-label">总缓冲面积(km²)</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-value">{{ gisStore.heatmapData.length }}</div>
                <div class="stat-label">热力点数量</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-value">{{ gisStore.locationList.length }}</div>
                <div class="stat-label">标记点数量</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useGisStore } from '@/stores/gis'
import { ElMessage, ElMessageBox } from 'element-plus'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const gisStore = useGisStore()

const mapContainer = ref(null)
const mapLoading = ref(true)
const activeTab = ref('buffer')
const overlayLoading = ref(false)
const overlayResult = ref(null)

let map = null
let markers = []
let bufferLayers = []
let heatmapLayer = null

const showPoints = ref(1)
const showBuffers = ref(1)
const showHeatmap = ref(0)

const bufferForm = ref({
  centerName: '',
  radius: 2000,
  unit: 'meters',
  color: '#409EFF'
})

const heatmapForm = ref({
  dataType: 'population',
  radius: 30,
  opacity: 0.8
})

const overlayForm = ref({
  layerA: 'business',
  layerB: 'green',
  operation: 'intersect'
})

const heatmapDataList = computed(() => {
  return gisStore.heatmapData || []
})

const totalBufferArea = computed(() => {
  return gisStore.bufferZones.reduce((sum, zone) => {
    const areaMatch = zone.area.match(/[\d.]+/)
    return sum + (areaMatch ? parseFloat(areaMatch[0]) : 0)
  }, 0)
})

const formatRadius = (val) => {
  return `${val} 米`
}

const getHeatmapColor = (intensity) => {
  if (intensity >= 0.8) return '#f56c6c'
  if (intensity >= 0.5) return '#e6a23c'
  return '#67c23a'
}

const getOperationLabel = (operation) => {
  const labels = {
    intersect: '交集分析',
    union: '并集分析',
    difference: '差集分析'
  }
  return labels[operation] || operation
}

const initMap = () => {
  if (!mapContainer.value) return
  
  mapLoading.value = true
  
  map = L.map(mapContainer.value).setView([39.9042, 116.4074], 12)
  
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri',
    maxZoom: 17,
    maxNativeZoom: 17,
    minZoom: 3,
    noWrap: true,
    errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAAWdEVYdENyZWF0aW9uIFRpbWUAMjAyNi0wNC0yN1RNNDoyNjoyNyswODowMG9418sAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAN/SURBVO3YMQ0AIAwEsf+/h6YwKJO6RzfsQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACg0+6aNl6X73+hQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALC49wMAAP//zQsAAAD//xEAAAAA//8EAAAAAP//BA=='
  }).addTo(map)
  
  mapLoading.value = false
}

const updateMarkers = () => {
  if (!map) return
  
  markers.forEach(m => map.removeLayer(m))
  markers = []
  
  if (!showPoints.value) return
  
  gisStore.locationList.forEach(location => {
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: 32px;
        height: 32px;
        background-color: #409EFF;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: bold;
      ">${location.name.charAt(0)}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    })
    
    const m = L.marker([location.latitude, location.longitude], { icon: customIcon }).addTo(map)
    m.bindPopup(`<b>${location.name}</b><br>${location.type}`)
    markers.push(m)
  })
}

const updateBufferLayers = () => {
  if (!map) return
  
  bufferLayers.forEach(layer => map.removeLayer(layer))
  bufferLayers = []
  
  if (!showBuffers.value) return
  
  gisStore.bufferZones.forEach(zone => {
    const circle = L.circle([zone.center.lat, zone.center.lng], {
      color: zone.color || '#409EFF',
      fillColor: zone.color || '#409EFF',
      fillOpacity: 0.3,
      radius: zone.radius
    }).addTo(map)
    
    circle.bindPopup(`<b>${zone.name}</b><br>半径: ${zone.radius}米<br>面积: ${zone.area}`)
    bufferLayers.push(circle)
  })
}

const handleSelectCenter = (name) => {
  const location = gisStore.locationList.find(loc => loc.name === name)
  if (location && map) {
    map.setView([location.latitude, location.longitude], 14)
  }
}

const createBufferZone = async () => {
  if (!bufferForm.value.centerName) {
    ElMessage.warning('请选择中心点')
    return
  }
  
  const location = gisStore.locationList.find(loc => loc.name === bufferForm.value.centerName)
  if (!location) {
    ElMessage.error('未找到该位置')
    return
  }
  
  const radius = bufferForm.value.unit === 'kilometers' 
    ? bufferForm.value.radius * 1000 
    : bufferForm.value.radius
  
  await gisStore.addBufferZone({
    name: `${bufferForm.value.centerName} - ${radius}米缓冲区`,
    lat: location.latitude,
    lng: location.longitude,
    radius: radius,
    color: bufferForm.value.color
  })
  
  updateBufferLayers()
  ElMessage.success('缓冲区创建成功')
}

const clearBufferZones = () => {
  gisStore.bufferZones.length = 0
  updateBufferLayers()
  ElMessage.success('已清除所有缓冲区')
}

const focusBuffer = (zone) => {
  if (map) {
    map.setView([zone.center.lat, zone.center.lng], 14)
  }
}

const removeBuffer = (zone) => {
  ElMessageBox.confirm(
    `确定要删除缓冲区"${zone.name}"吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = gisStore.bufferZones.indexOf(zone)
    if (index > -1) {
      gisStore.bufferZones.splice(index, 1)
      updateBufferLayers()
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

const generateHeatmap = async () => {
  await gisStore.fetchHeatmapData()
  showHeatmap.value = 1
  ElMessage.success('热力图生成成功')
}

const clearHeatmap = () => {
  gisStore.heatmapData.length = 0
  showHeatmap.value = 0
  ElMessage.success('已清除热力图')
}

const executeOverlayAnalysis = async () => {
  overlayLoading.value = true
  
  setTimeout(() => {
    overlayResult.value = {
      area: Math.random() * 50 + 10,
      featureCount: Math.floor(Math.random() * 20) + 5
    }
    overlayLoading.value = false
    ElMessage.success('叠加分析完成')
  }, 1500)
}

watch([showPoints, showBuffers, showHeatmap], () => {
  updateMarkers()
  updateBufferLayers()
})

onMounted(() => {
  gisStore.fetchLocationList()
  gisStore.fetchBufferZones()
  gisStore.fetchHeatmapData()
  
  setTimeout(() => {
    initMap()
    updateMarkers()
    updateBufferLayers()
  }, 100)
})
</script>

<style scoped>
.gis-analysis {
  height: 100%;
}

.analysis-tools-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.layer-controls {
  display: flex;
  gap: 15px;
}

.map-card {
  height: 500px;
}

.map-container {
  height: 420px;
  width: 100%;
  border-radius: 4px;
  position: relative;
}

.map-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 14px;
}

.map-loading .el-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.buffer-list {
  max-height: 300px;
  overflow-y: auto;
}

.buffer-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 8px;
}

.buffer-info {
  flex: 1;
}

.buffer-name {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 4px;
}

.buffer-detail {
  font-size: 12px;
  color: #909399;
}

.buffer-actions {
  display: flex;
  gap: 5px;
}

.statistics-card {
  margin-top: 20px;
}

.stat-item {
  text-align: center;
  padding: 15px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #409EFF;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.overlay-result {
  padding: 10px 0;
}
</style>
