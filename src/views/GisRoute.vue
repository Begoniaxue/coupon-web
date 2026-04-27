<template>
  <div class="gis-route">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="route-card">
          <template #header>
            <span>路径规划</span>
          </template>
          
          <el-form :model="routeForm" label-width="80px">
            <el-form-item label="出行方式">
              <el-radio-group v-model="routeForm.mode" size="large">
                <el-radio-button value="driving">
                  <el-icon><Van /></el-icon>
                  <span style="margin-left: 5px;">驾车</span>
                </el-radio-button>
                <el-radio-button value="cycling">
                  <el-icon><Bicycle /></el-icon>
                  <span style="margin-left: 5px;">骑行</span>
                </el-radio-button>
                <el-radio-button value="walking">
                  <el-icon><Position /></el-icon>
                  <span style="margin-left: 5px;">步行</span>
                </el-radio-button>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="起点">
              <el-select
                v-model="routeForm.startPoint"
                placeholder="请选择或输入起点"
                filterable
                allow-create
                style="width: 100%"
              >
                <el-option
                  v-for="loc in locationOptions"
                  :key="loc.id"
                  :label="loc.name"
                  :value="loc.name"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="终点">
              <el-select
                v-model="routeForm.endPoint"
                placeholder="请选择或输入终点"
                filterable
                allow-create
                style="width: 100%"
              >
                <el-option
                  v-for="loc in locationOptions"
                  :key="loc.id"
                  :label="loc.name"
                  :value="loc.name"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="途经点">
              <div class="waypoints-container">
                <div
                  v-for="(wp, index) in routeForm.waypoints"
                  :key="index"
                  class="waypoint-item"
                >
                  <el-select
                    v-model="routeForm.waypoints[index]"
                    placeholder="选择途经点"
                    filterable
                    allow-create
                    style="flex: 1"
                  >
                    <el-option
                      v-for="loc in locationOptions"
                      :key="loc.id"
                      :label="loc.name"
                      :value="loc.name"
                    />
                  </el-select>
                  <el-button type="danger" icon="Delete" circle @click="removeWaypoint(index)" />
                </div>
                <el-button type="primary" link icon="Plus" @click="addWaypoint">
                  添加途经点
                </el-button>
              </div>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="calculateRoute" :loading="gisStore.loading">
                <el-icon><Search /></el-icon>
                规划路线
              </el-button>
              <el-button @click="resetRoute">
                <el-icon><Refresh /></el-icon>
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="saved-routes-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span>保存的路线</span>
              <el-button type="primary" link size="small" @click="saveCurrentRoute">
                <el-icon><Plus /></el-icon>
                保存
              </el-button>
            </div>
          </template>
          <div class="saved-routes-list">
            <div
              v-for="route in savedRoutes"
              :key="route.id"
              class="saved-route-item"
              @click="loadSavedRoute(route)"
            >
              <div class="route-info">
                <div class="route-name">{{ route.name }}</div>
                <div class="route-detail">
                  {{ route.startPoint }} → {{ route.endPoint }}
                </div>
                <div class="route-stats">
                  <el-tag size="small" type="info">{{ route.distance }} km</el-tag>
                  <el-tag size="small" type="info">{{ route.duration }} 分钟</el-tag>
                </div>
              </div>
              <div class="route-actions">
                <el-button type="danger" link size="small" @click.stop="deleteSavedRoute(route)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            <el-empty v-if="savedRoutes.length === 0" description="暂无保存的路线" />
          </div>
        </el-card>

        <el-card v-if="gisStore.currentRoute" class="route-result-card" style="margin-top: 20px;">
          <template #header>
            <span>路线信息</span>
          </template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="出发时间">
              {{ formatTime(new Date()) }}
            </el-descriptions-item>
            <el-descriptions-item label="预计到达">
              {{ formatTime(new Date(Date.now() + gisStore.currentRoute.duration * 60000)) }}
            </el-descriptions-item>
            <el-descriptions-item label="总距离">
              <span style="font-weight: bold; color: #409EFF; font-size: 18px;">
                {{ gisStore.currentRoute.distance.toFixed(2) }} km
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="预计时间">
              <span style="font-weight: bold; color: #67C23A; font-size: 18px;">
                {{ gisStore.currentRoute.duration }} 分钟
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="出行方式">
              <el-tag>{{ getModeLabel(gisStore.currentRoute.mode) }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
          
          <div class="route-actions" style="margin-top: 15px;">
            <el-button type="primary">
              <el-icon><Guide /></el-icon>
              开始导航
            </el-button>
            <el-button type="success">
              <el-icon><Share /></el-icon>
              分享路线
            </el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card class="map-card">
          <template #header>
            <div class="card-header">
              <span>路线地图</span>
              <div class="map-controls">
                <el-button-group>
                  <el-button
                    type="primary"
                    :plain="!showRoute"
                    @click="showRoute = !showRoute"
                  >
                    显示路线
                  </el-button>
                  <el-button
                    type="success"
                    :plain="!showMarkers"
                    @click="showMarkers = !showMarkers"
                  >
                    显示标记
                  </el-button>
                </el-button-group>
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

        <el-card v-if="gisStore.currentRoute" class="turn-by-turn-card" style="margin-top: 20px;">
          <template #header>
            <span>导航指引</span>
          </template>
          <el-timeline>
            <el-timeline-item
              placement="top"
              type="primary"
              icon="Location"
            >
              <h4>起点: {{ gisStore.currentRoute.startPoint.name }}</h4>
              <p>{{ gisStore.currentRoute.startPoint.address }}</p>
            </el-timeline-item>
            
            <el-timeline-item
              v-for="(wp, index) in gisStore.currentRoute.waypoints"
              :key="index"
              placement="top"
              type="warning"
              icon="Plus"
            >
              <h4>途经点 {{ index + 1 }}: {{ wp.name }}</h4>
              <p>{{ wp.address }}</p>
            </el-timeline-item>
            
            <el-timeline-item
              placement="top"
              type="success"
              icon="CircleCheck"
            >
              <h4>终点: {{ gisStore.currentRoute.endPoint.name }}</h4>
              <p>{{ gisStore.currentRoute.endPoint.address }}</p>
            </el-timeline-item>
          </el-timeline>
        </el-card>

        <el-card class="alternative-routes-card" style="margin-top: 20px;">
          <template #header>
            <span>备选路线</span>
          </template>
          <el-radio-group v-model="selectedAlternative">
            <el-card v-for="(route, index) in alternativeRoutes" :key="index" class="alternative-route-item">
              <el-radio :value="index" style="width: 100%;">
                <div class="alternative-route-info">
                  <span class="route-title">方案 {{ index + 1 }}</span>
                  <span class="route-time">{{ route.duration }} 分钟</span>
                  <span class="route-distance">{{ route.distance }} km</span>
                  <el-tag v-if="route.traffic" type="danger">拥堵</el-tag>
                  <el-tag v-else type="success">畅通</el-tag>
                </div>
                <div class="alternative-route-detail">
                  {{ route.description }}
                </div>
              </el-radio>
            </el-card>
          </el-radio-group>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useGisStore } from '@/stores/gis'
import { ElMessage, ElMessageBox } from 'element-plus'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const route = useRoute()
const gisStore = useGisStore()

const mapContainer = ref(null)
const mapLoading = ref(true)
const showRoute = ref(true)
const showMarkers = ref(true)
const selectedAlternative = ref(0)

let map = null
let routeLine = null
let markers = []

const routeForm = ref({
  mode: 'driving',
  startPoint: '',
  endPoint: '',
  waypoints: []
})

const savedRoutes = ref([
  {
    id: 1,
    name: '北京一日游',
    startPoint: '北京天安门',
    endPoint: '万达广场',
    waypoints: ['银泰中心'],
    distance: 8.5,
    duration: 45,
    mode: 'driving'
  },
  {
    id: 2,
    name: '上海购物游',
    startPoint: '上海外滩',
    endPoint: '恒隆广场',
    waypoints: [],
    distance: 5.2,
    duration: 25,
    mode: 'driving'
  }
])

const alternativeRoutes = ref([
  {
    duration: 45,
    distance: 8.5,
    traffic: false,
    description: '推荐路线 - 最快路径，经过主要干道'
  },
  {
    duration: 52,
    distance: 9.2,
    traffic: false,
    description: '备选路线 - 避开高速，走辅路'
  },
  {
    duration: 60,
    distance: 10.8,
    traffic: true,
    description: '备选路线 - 风景路线，经过市中心'
  }
])

const locationOptions = computed(() => {
  return gisStore.locationList || []
})

const formatTime = (date) => {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const getModeLabel = (mode) => {
  const labels = {
    driving: '驾车',
    cycling: '骑行',
    walking: '步行'
  }
  return labels[mode] || mode
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
  
  if (!showMarkers.value) return
  
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

const drawRouteLine = () => {
  if (!map || !gisStore.currentRoute) return
  
  if (routeLine) {
    map.removeLayer(routeLine)
  }
  
  if (!showRoute.value) return
  
  const path = gisStore.currentRoute.path
  
  const latLngs = path.map(coord => [coord[1], coord[0]])
  
  routeLine = L.polyline(latLngs, {
    color: '#409EFF',
    weight: 5,
    opacity: 0.8,
    smoothFactor: 1
  }).addTo(map)
  
  const startMarker = L.marker(latLngs[0], {
    icon: L.divIcon({
      className: 'start-marker',
      html: '<div style="background-color: #67C23A; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    })
  }).addTo(map)
  
  const endMarker = L.marker(latLngs[latLngs.length - 1], {
    icon: L.divIcon({
      className: 'end-marker',
      html: '<div style="background-color: #F56C6C; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    })
  }).addTo(map)
  
  markers.push(startMarker, endMarker)
  
  map.fitBounds(routeLine.getBounds(), { padding: [50, 50] })
}

const addWaypoint = () => {
  routeForm.value.waypoints.push('')
}

const removeWaypoint = (index) => {
  routeForm.value.waypoints.splice(index, 1)
}

const calculateRoute = async () => {
  if (!routeForm.value.startPoint) {
    ElMessage.warning('请选择起点')
    return
  }
  if (!routeForm.value.endPoint) {
    ElMessage.warning('请选择终点')
    return
  }
  
  await gisStore.calculateNewRoute({
    startPoint: routeForm.value.startPoint,
    endPoint: routeForm.value.endPoint,
    waypoints: routeForm.value.waypoints.filter(wp => wp),
    mode: routeForm.value.mode
  })
  
  drawRouteLine()
  ElMessage.success('路线规划完成')
}

const resetRoute = () => {
  routeForm.value = {
    mode: 'driving',
    startPoint: '',
    endPoint: '',
    waypoints: []
  }
  
  if (routeLine) {
    map.removeLayer(routeLine)
    routeLine = null
  }
  
  gisStore.currentRoute = null
  ElMessage.success('已重置')
}

const saveCurrentRoute = () => {
  if (!gisStore.currentRoute) {
    ElMessage.warning('请先规划路线')
    return
  }
  
  ElMessageBox.prompt('请输入路线名称', '保存路线', {
    confirmButtonText: '保存',
    cancelButtonText: '取消',
    inputPattern: /.+/,
    inputErrorMessage: '请输入路线名称'
  }).then(({ value }) => {
    const newRoute = {
      id: Date.now(),
      name: value,
      startPoint: routeForm.value.startPoint,
      endPoint: routeForm.value.endPoint,
      waypoints: [...routeForm.value.waypoints],
      distance: gisStore.currentRoute.distance,
      duration: gisStore.currentRoute.duration,
      mode: routeForm.value.mode
    }
    
    savedRoutes.value.push(newRoute)
    ElMessage.success('路线已保存')
  }).catch(() => {})
}

const loadSavedRoute = (savedRoute) => {
  routeForm.value = {
    mode: savedRoute.mode,
    startPoint: savedRoute.startPoint,
    endPoint: savedRoute.endPoint,
    waypoints: [...savedRoute.waypoints]
  }
  
  ElMessage.success('已加载保存的路线，请点击"规划路线"重新计算')
}

const deleteSavedRoute = (route) => {
  ElMessageBox.confirm(
    `确定要删除路线"${route.name}"吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = savedRoutes.value.indexOf(route)
    if (index > -1) {
      savedRoutes.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

watch([showRoute, showMarkers], () => {
  updateMarkers()
  drawRouteLine()
})

onMounted(() => {
  gisStore.fetchLocationList()
  
  if (route.query.addLocation) {
    if (!routeForm.value.startPoint) {
      routeForm.value.startPoint = route.query.addLocation
    } else if (!routeForm.value.endPoint) {
      routeForm.value.endPoint = route.query.addLocation
    } else {
      routeForm.value.waypoints.push(route.query.addLocation)
    }
  }
  
  setTimeout(() => {
    initMap()
    updateMarkers()
  }, 100)
})
</script>

<style scoped>
.gis-route {
  height: 100%;
}

.route-card, .saved-routes-card, .route-result-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.map-controls {
  display: flex;
  gap: 10px;
}

.waypoints-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.waypoint-item {
  display: flex;
  align-items: center;
  gap: 10px;
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

.saved-routes-list {
  max-height: 300px;
  overflow-y: auto;
}

.saved-route-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.saved-route-item:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
}

.route-info {
  flex: 1;
  min-width: 0;
}

.route-name {
  font-weight: bold;
  font-size: 15px;
  margin-bottom: 4px;
}

.route-detail {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.route-stats {
  display: flex;
  gap: 8px;
}

.route-actions {
  display: flex;
  gap: 5px;
}

.turn-by-turn-card, .alternative-routes-card {
  margin-top: 20px;
}

.alternative-route-item {
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.alternative-route-item:hover {
  border-color: #409EFF;
}

.alternative-route-info {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 8px;
}

.route-title {
  font-weight: bold;
  color: #303133;
}

.route-time {
  color: #409EFF;
  font-weight: bold;
}

.route-distance {
  color: #909399;
}

.alternative-route-detail {
  font-size: 13px;
  color: #606266;
  padding-left: 20px;
}
</style>
