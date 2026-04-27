<template>
  <div class="gis-3d">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="control-card">
          <template #header>
            <span>三维场景控制</span>
          </template>
          
          <el-form :model="sceneForm" label-width="80px">
            <el-form-item label="视图模式">
              <el-radio-group v-model="sceneForm.viewMode">
                <el-radio-button value="3d">3D</el-radio-button>
                <el-radio-button value="2d">2D</el-radio-button>
                <el-radio-button value="columbus">哥伦布</el-radio-button>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="地形显示">
              <el-switch v-model="sceneForm.showTerrain" />
            </el-form-item>
            
            <el-form-item label="天空盒">
              <el-switch v-model="sceneForm.showSkyBox" />
            </el-form-item>
            
            <el-form-item label="光照效果">
              <el-switch v-model="sceneForm.showLighting" />
            </el-form-item>
            
            <el-form-item label="帧率显示">
              <el-switch v-model="sceneForm.showFPS" />
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="layers-card" style="margin-top: 20px;">
          <template #header>
            <span>图层管理</span>
          </template>
          <div class="layer-list">
            <div
              v-for="layer in layers"
              :key="layer.id"
              class="layer-item"
            >
              <el-checkbox
                v-model="layer.visible"
                @change="toggleLayer(layer)"
              >
                {{ layer.name }}
              </el-checkbox>
              <el-tag size="small" :type="layer.type">{{ layer.typeLabel }}</el-tag>
            </div>
          </div>
        </el-card>

        <el-card class="locations-3d-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span>3D位置点</span>
              <el-button type="primary" link size="small" @click="flyToAll">
                <el-icon><Position /></el-icon>
                全部
              </el-button>
            </div>
          </template>
          <div class="locations-list">
            <div
              v-for="loc in gisStore.locations3D"
              :key="loc.id"
              class="location-item"
              @click="flyToLocation(loc)"
            >
              <div class="location-icon" :style="{ backgroundColor: getTypeColor(loc.type) }">
                {{ loc.name.charAt(0) }}
              </div>
              <div class="location-info">
                <div class="location-name">{{ loc.name }}</div>
                <div class="location-detail">
                  高度: {{ loc.height }}m | 层数: {{ loc.extrusionHeight }}
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="animation-card" style="margin-top: 20px;">
          <template #header>
            <span>飞行动画</span>
          </template>
          <div class="animation-controls">
            <el-button type="primary" @click="startTour">
              <el-icon><VideoPlay /></el-icon>
              开始游览
            </el-button>
            <el-button @click="stopTour">
              <el-icon><VideoPause /></el-icon>
              停止
            </el-button>
            <el-slider
              v-model="animationSpeed"
              :min="0.5"
              :max="3"
              :step="0.5"
              :format-tooltip="formatSpeed"
              style="margin-top: 15px;"
            />
            <div style="text-align: center; color: #909399; font-size: 12px; margin-top: 5px;">
              速度: {{ animationSpeed }}x
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="18">
        <el-card class="viewer-card">
          <template #header>
            <div class="card-header">
              <span>三维地球视图</span>
              <div class="viewer-controls">
                <el-button-group>
                  <el-button size="small" @click="resetView">
                    <el-icon><Refresh /></el-icon>
                    重置视图
                  </el-button>
                  <el-button size="small" @click="toggleFullscreen">
                    <el-icon><FullScreen /></el-icon>
                    全屏
                  </el-button>
                </el-button-group>
              </div>
            </div>
          </template>
          <div ref="viewerContainer" class="viewer-container">
            <div v-if="viewerLoading" class="viewer-loading">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>加载三维场景中...</span>
              <span style="font-size: 12px; margin-top: 10px;">正在初始化 Cesium 引擎...</span>
            </div>
            <div v-else class="fallback-viewer">
              <div class="fallback-header">
                <h3>3D 地理信息系统预览</h3>
                <p>模拟三维地球场景（基于 Leaflet 的增强版）</p>
              </div>
              <div ref="fallbackMap" class="fallback-map-container"></div>
              <div class="fallback-info">
                <el-row :gutter="20">
                  <el-col :span="8">
                    <div class="info-item">
                      <div class="info-value">{{ gisStore.locations3D.length }}</div>
                      <div class="info-label">3D建筑</div>
                    </div>
                  </el-col>
                  <el-col :span="8">
                    <div class="info-item">
                      <div class="info-value">{{ terrainPoints.length }}</div>
                      <div class="info-label">地形点</div>
                    </div>
                  </el-col>
                  <el-col :span="8">
                    <div class="info-item">
                      <div class="info-value">{{ cameraInfo.altitude.toFixed(0) }}</div>
                      <div class="info-label">高度(m)</div>
                    </div>
                  </el-col>
                </el-row>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="properties-card" style="margin-top: 20px;" v-if="selectedEntity">
          <template #header>
            <div class="card-header">
              <span>实体属性</span>
              <el-button type="primary" link size="small" @click="selectedEntity = null">
                关闭
              </el-button>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="名称">{{ selectedEntity.name }}</el-descriptions-item>
            <el-descriptions-item label="类型">
              <el-tag>{{ selectedEntity.type }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="纬度">{{ selectedEntity.latitude }}</el-descriptions-item>
            <el-descriptions-item label="经度">{{ selectedEntity.longitude }}</el-descriptions-item>
            <el-descriptions-item label="建筑高度">{{ selectedEntity.height }} m</el-descriptions-item>
            <el-descriptions-item label="拉伸高度">{{ selectedEntity.extrusionHeight }} m</el-descriptions-item>
            <el-descriptions-item label="地址" :span="2">{{ selectedEntity.address }}</el-descriptions-item>
            <el-descriptions-item label="描述" :span="2">{{ selectedEntity.description }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="camera-info-card" style="margin-top: 20px;">
          <template #header>
            <span>相机信息</span>
          </template>
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="camera-item">
                <div class="camera-label">经度</div>
                <div class="camera-value">{{ cameraInfo.longitude.toFixed(6) }}°</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="camera-item">
                <div class="camera-label">纬度</div>
                <div class="camera-value">{{ cameraInfo.latitude.toFixed(6) }}°</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="camera-item">
                <div class="camera-label">高度</div>
                <div class="camera-value">{{ cameraInfo.altitude.toFixed(0) }} m</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="camera-item">
                <div class="camera-label">俯仰角</div>
                <div class="camera-value">{{ cameraInfo.pitch.toFixed(1) }}°</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useGisStore } from '@/stores/gis'
import { ElMessage } from 'element-plus'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const gisStore = useGisStore()

const viewerContainer = ref(null)
const fallbackMap = ref(null)
const viewerLoading = ref(true)
const selectedEntity = ref(null)
const animationSpeed = ref(1)
let isTourRunning = false
let tourInterval = null
let map = null
let markers = []

const sceneForm = ref({
  viewMode: '3d',
  showTerrain: true,
  showSkyBox: true,
  showLighting: false,
  showFPS: false
})

const layers = ref([
  { id: 1, name: '建筑模型', type: '3d', typeLabel: '3D', visible: true },
  { id: 2, name: '地形数据', type: 'terrain', typeLabel: '地形', visible: true },
  { id: 3, name: '标记点', type: 'marker', typeLabel: '标记', visible: true },
  { id: 4, name: '路线', type: 'route', typeLabel: '路线', visible: false }
])

const cameraInfo = ref({
  longitude: 116.4074,
  latitude: 39.9042,
  altitude: 10000,
  pitch: -45,
  heading: 0
})

const terrainPoints = computed(() => {
  return gisStore.terrainData || []
})

const getTypeColor = (type) => {
  const colors = {
    '商业中心': '#409EFF',
    '景点': '#67C23A',
    '政府机构': '#E6A23C'
  }
  return colors[type] || '#409EFF'
}

const formatSpeed = (val) => {
  return `${val}x`
}

const initFallbackViewer = () => {
  if (!fallbackMap.value) return
  
  viewerLoading.value = true
  
  map = L.map(fallbackMap.value).setView([39.9042, 116.4074], 11)
  
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri',
    maxZoom: 17,
    maxNativeZoom: 17,
    minZoom: 3,
    noWrap: true,
    errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAAWdEVYdENyZWF0aW9uIFRpbWUAMjAyNi0wNC0yN1RNNDoyNjoyNyswODowMG9418sAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAN/SURBVO3YMQ0AIAwEsf+/h6YwKJO6RzfsQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACg0+6aNl6X73+hQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALC49wMAAP//zQsAAAD//xEAAAAA//8EAAAAAP//BA=='
  }).addTo(map)
  
  gisStore.locations3D.forEach(location => {
    const customIcon = L.divIcon({
      className: '3d-marker',
      html: `<div style="
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, ${getTypeColor(location.type)} 0%, ${adjustColor(getTypeColor(location.type), -30)} 100%);
        border-radius: 8px;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 2px ${getTypeColor(location.type)}40;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        font-weight: bold;
        transform: perspective(100px) rotateX(10deg);
        position: relative;
      ">
        ${location.name.charAt(0)}
        <div style="
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid white;
        "></div>
      </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40]
    })
    
    const m = L.marker([location.latitude, location.longitude], { icon: customIcon }).addTo(map)
    m.bindPopup(`
      <div style="min-width: 200px;">
        <h4 style="margin: 0 0 8px 0; color: #303133;">${location.name}</h4>
        <div style="font-size: 12px; color: #909399; margin-bottom: 8px;">${location.type}</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
          <div><strong>建筑高度:</strong> ${location.height}m</div>
          <div><strong>拉伸高度:</strong> ${location.extrusionHeight}m</div>
          <div style="grid-column: span 2;"><strong>地址:</strong> ${location.address}</div>
        </div>
      </div>
    `)
    m.on('click', () => {
      selectedEntity.value = location
    })
    markers.push(m)
  })
  
  map.on('move', () => {
    const center = map.getCenter()
    const zoom = map.getZoom()
    
    cameraInfo.value = {
      longitude: center.lng,
      latitude: center.lat,
      altitude: Math.max(100, 20000 / Math.pow(2, zoom - 1)),
      pitch: -45,
      heading: 0
    }
  })
  
  viewerLoading.value = false
}

const adjustColor = (color, amount) => {
  const num = parseInt(color.replace('#', ''), 16)
  const r = Math.max(0, Math.min(255, (num >> 16) + amount))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount))
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount))
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`
}

const toggleLayer = (layer) => {
  ElMessage.info(`${layer.visible ? '显示' : '隐藏'}图层: ${layer.name}`)
}

const flyToLocation = (location) => {
  if (map) {
    map.flyTo([location.latitude, location.longitude], 15, {
      duration: 2
    })
    selectedEntity.value = location
  }
}

const flyToAll = () => {
  if (map && gisStore.locations3D.length > 0) {
    const bounds = L.latLngBounds(
      gisStore.locations3D.map(loc => [loc.latitude, loc.longitude])
    )
    map.fitBounds(bounds, { padding: [50, 50] })
  }
}

const resetView = () => {
  if (map) {
    map.setView([39.9042, 116.4074], 11)
  }
  selectedEntity.value = null
  ElMessage.success('视图已重置')
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    viewerContainer.value.requestFullscreen().catch(err => {
      ElMessage.error('无法进入全屏模式')
    })
  } else {
    document.exitFullscreen()
  }
}

const startTour = () => {
  if (gisStore.locations3D.length === 0) {
    ElMessage.warning('没有可游览的位置点')
    return
  }
  
  isTourRunning = true
  let currentIndex = 0
  
  const tourStep = () => {
    if (!isTourRunning) return
    
    if (currentIndex < gisStore.locations3D.length) {
      flyToLocation(gisStore.locations3D[currentIndex])
      currentIndex++
    } else {
      currentIndex = 0
    }
  }
  
  tourStep()
  tourInterval = setInterval(tourStep, 5000 / animationSpeed.value)
  
  ElMessage.success('开始自动游览')
}

const stopTour = () => {
  isTourRunning = false
  if (tourInterval) {
    clearInterval(tourInterval)
    tourInterval = null
  }
  ElMessage.info('已停止游览')
}

watch(animationSpeed, () => {
  if (isTourRunning) {
    stopTour()
    startTour()
  }
})

watch(() => sceneForm.viewMode, (newMode) => {
  const modeLabels = {
    '3d': '三维模式',
    '2d': '二维模式',
    'columbus': '哥伦布视图'
  }
  ElMessage.info(`已切换到: ${modeLabels[newMode]}`)
})

onMounted(() => {
  gisStore.fetch3DLocations()
  gisStore.fetchTerrainData({
    centerLat: 39.9042,
    centerLng: 116.4074,
    radius: 10000
  })
  
  setTimeout(() => {
    initFallbackViewer()
  }, 200)
})

onUnmounted(() => {
  stopTour()
  if (map) {
    map.remove()
  }
})
</script>

<style scoped>
.gis-3d {
  height: 100%;
}

.control-card, .layers-card, .locations-3d-card, .animation-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.viewer-controls {
  display: flex;
  gap: 10px;
}

.layer-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.layer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.locations-list {
  max-height: 300px;
  overflow-y: auto;
}

.location-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.location-item:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
}

.location-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  margin-right: 12px;
  flex-shrink: 0;
}

.location-info {
  flex: 1;
  min-width: 0;
}

.location-name {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 4px;
}

.location-detail {
  font-size: 12px;
  color: #909399;
}

.animation-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.viewer-card {
  height: 600px;
}

.viewer-container {
  height: 520px;
  width: 100%;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.viewer-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 16px;
  z-index: 1000;
}

.viewer-loading .el-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.fallback-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.fallback-header {
  padding: 15px 20px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
}

.fallback-header h3 {
  margin: 0 0 5px 0;
  font-size: 18px;
}

.fallback-header p {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.fallback-map-container {
  flex: 1;
  min-height: 300px;
}

.fallback-info {
  padding: 15px 20px;
  background: #f5f7fa;
}

.info-item {
  text-align: center;
  padding: 10px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.info-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
}

.info-label {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.properties-card, .camera-info-card {
  margin-top: 20px;
}

.camera-item {
  text-align: center;
  padding: 10px;
}

.camera-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.camera-value {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  font-family: 'Monaco', 'Menlo', monospace;
}
</style>
