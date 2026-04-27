<template>
  <div class="gis-query">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="search-card">
          <template #header>
            <span>查询条件</span>
          </template>
          <el-form :model="searchForm" label-width="80px">
            <el-form-item label="关键词">
              <el-input
                v-model="searchForm.keyword"
                placeholder="请输入名称或地址"
                clearable
                @keyup.enter="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="位置类型">
              <el-select
                v-model="searchForm.type"
                placeholder="请选择类型"
                clearable
                style="width: 100%"
              >
                <el-option label="商业中心" value="商业中心" />
                <el-option label="景点" value="景点" />
                <el-option label="政府机构" value="政府机构" />
              </el-select>
            </el-form-item>
            <el-form-item label="附近搜索">
              <el-input-number
                v-model="searchForm.radius"
                :min="500"
                :max="50000"
                :step="500"
                controls-position="right"
                style="width: 100%"
              />
              <span style="color: #909399; font-size: 12px;">米（以地图中心为基准）</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch" :loading="gisStore.loading">
                <el-icon><Search /></el-icon>
                查询
              </el-button>
              <el-button @click="handleReset">
                <el-icon><Refresh /></el-icon>
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="results-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span>查询结果</span>
              <el-tag type="info">{{ gisStore.locationList.length }} 条记录</el-tag>
            </div>
          </template>
          <div class="results-list">
            <div
              v-for="location in gisStore.locationList"
              :key="location.id"
              class="result-item"
              :class="{ active: selectedLocation?.id === location.id }"
              @click="handleSelectLocation(location)"
            >
              <div class="result-icon" :style="{ backgroundColor: getTypeColor(location.type) }">
                {{ location.name.charAt(0) }}
              </div>
              <div class="result-info">
                <div class="result-name">{{ location.name }}</div>
                <div class="result-type">
                  <el-tag size="small">{{ location.type }}</el-tag>
                </div>
                <div class="result-address">{{ location.address }}</div>
              </div>
              <div class="result-actions">
                <el-button type="primary" link size="small" @click.stop="handleViewDetail(location)">
                  详情
                </el-button>
                <el-button type="success" link size="small" @click.stop="handleFocusLocation(location)">
                  定位
                </el-button>
              </div>
            </div>
            <div v-if="gisStore.locationList.length === 0 && !gisStore.loading" class="empty-result">
              <el-empty description="暂无查询结果" />
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card class="map-card">
          <template #header>
            <div class="card-header">
              <span>地图视图</span>
              <div class="map-controls">
                <el-radio-group v-model="mapViewMode" size="small">
                  <el-radio-button label="normal">标准</el-radio-button>
                  <el-radio-button label="satellite">卫星</el-radio-button>
                  <el-radio-button label="terrain">地形</el-radio-button>
                </el-radio-group>
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

        <el-card v-if="selectedLocation" class="detail-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span>位置详情</span>
              <el-button type="primary" link size="small" @click="selectedLocation = null">
                关闭
              </el-button>
            </div>
          </template>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="名称">{{ selectedLocation.name }}</el-descriptions-item>
            <el-descriptions-item label="类型">
              <el-tag>{{ selectedLocation.type }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="ID">{{ selectedLocation.id }}</el-descriptions-item>
            <el-descriptions-item label="纬度">{{ selectedLocation.latitude }}</el-descriptions-item>
            <el-descriptions-item label="经度">{{ selectedLocation.longitude }}</el-descriptions-item>
            <el-descriptions-item label="地址">{{ selectedLocation.address }}</el-descriptions-item>
            <el-descriptions-item label="描述" :span="3">{{ selectedLocation.description }}</el-descriptions-item>
            <el-descriptions-item label="标签" :span="3">
              <el-tag v-for="tag in selectedLocation.tags" :key="tag" style="margin-right: 5px;">
                {{ tag }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
          <div class="detail-actions" style="margin-top: 15px;">
            <el-button type="primary" @click="handleAddToRoute(selectedLocation)">
              <el-icon><Plus /></el-icon>
              添加到路径
            </el-button>
            <el-button type="success" @click="handleSearchNearby(selectedLocation)">
              <el-icon><Location /></el-icon>
              周边搜索
            </el-button>
            <el-button type="warning">
              <el-icon><Share /></el-icon>
              分享位置
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog
      v-model="nearbyDialogVisible"
      title="周边搜索"
      width="600px"
    >
      <el-form :model="nearbyForm" label-width="100px" style="margin-bottom: 20px;">
        <el-form-item label="中心点">
          <el-input :value="nearbyForm.center?.name" disabled />
        </el-form-item>
        <el-form-item label="搜索半径">
          <el-slider
            v-model="nearbyForm.radius"
            :min="500"
            :max="20000"
            :step="500"
            show-input
            :format-tooltip="formatRadius"
          />
        </el-form-item>
        <el-form-item label="位置类型">
          <el-checkbox-group v-model="nearbyForm.types">
            <el-checkbox label="商业中心">商业中心</el-checkbox>
            <el-checkbox label="景点">景点</el-checkbox>
            <el-checkbox label="政府机构">政府机构</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="executeNearbySearch">搜索</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="nearbyResults" v-loading="nearbyLoading">
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="address" label="地址" show-overflow-tooltip />
        <el-table-column label="距离" width="100">
          <template #default="{ row }">
            <span>{{ calculateDistance(nearbyForm.center, row).toFixed(2) }} km</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleSelectLocation(row)">
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGisStore } from '@/stores/gis'
import { ElMessage } from 'element-plus'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const router = useRouter()
const gisStore = useGisStore()

const mapContainer = ref(null)
const mapLoading = ref(true)
const mapViewMode = ref('normal')
const selectedLocation = ref(null)
const nearbyDialogVisible = ref(false)
const nearbyLoading = ref(false)
const nearbyResults = ref([])
let map = null
let markers = []

const searchForm = ref({
  keyword: '',
  type: '',
  radius: 5000
})

const nearbyForm = ref({
  center: null,
  radius: 2000,
  types: ['商业中心', '景点', '政府机构']
})

const getTypeColor = (type) => {
  const colors = {
    '商业中心': '#409EFF',
    '景点': '#67C23A',
    '政府机构': '#E6A23C'
  }
  return colors[type] || '#409EFF'
}

const initMap = () => {
  if (!mapContainer.value) return
  
  mapLoading.value = true
  
  map = L.map(mapContainer.value).setView([39.9042, 116.4074], 12)
  
  updateTileLayer()
  
  mapLoading.value = false
}

const updateTileLayer = () => {
  if (!map) return
  
  map.eachLayer((layer) => {
    if (layer instanceof L.TileLayer) {
      map.removeLayer(layer)
    }
  })
  
  let tileUrl = ''
  let attribution = ''
  
  let maxZoom = 17
  let maxNativeZoom = 17
  
  switch (mapViewMode.value) {
    case 'satellite':
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      attribution = 'Tiles &copy; Esri'
      maxZoom = 19
      maxNativeZoom = 18
      break
    case 'terrain':
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
      attribution = 'Tiles &copy; Esri'
      maxZoom = 16
      maxNativeZoom = 15
      break
    default:
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
      attribution = 'Tiles &copy; Esri'
      maxZoom = 17
      maxNativeZoom = 17
  }
  
  L.tileLayer(tileUrl, {
    attribution,
    maxZoom,
    maxNativeZoom,
    minZoom: 3,
    noWrap: true,
    errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAAWdEVYdENyZWF0aW9uIFRpbWUAMjAyNi0wNC0yN1RNNDoyNjoyNyswODowMG9418sAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAN/SURBVO3YMQ0AIAwEsf+/h6YwKJO6RzfsQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACg0+6aNl6X73+hQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALC49wMAAP//zQsAAAD//xEAAAAA//8EAAAAAP//BA=='
  }).addTo(map)
}

const updateMarkers = () => {
  if (!map) return
  
  markers.forEach(m => map.removeLayer(m))
  markers = []
  
  gisStore.locationList.forEach(location => {
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: 36px;
        height: 36px;
        background-color: ${getTypeColor(location.type)};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 3px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
      ">${location.name.charAt(0)}</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    })
    
    const m = L.marker([location.latitude, location.longitude], { icon: customIcon }).addTo(map)
    m.bindPopup(`<b>${location.name}</b><br>${location.type}<br>${location.address}`)
    m.on('click', () => handleSelectLocation(location))
    markers.push(m)
  })
}

const handleSearch = () => {
  const params = {}
  if (searchForm.value.keyword) {
    params.keyword = searchForm.value.keyword
  }
  if (searchForm.value.type) {
    params.type = searchForm.value.type
  }
  
  gisStore.fetchLocationList(params).then(() => {
    updateMarkers()
    if (gisStore.locationList.length > 0) {
      const bounds = L.latLngBounds(
        gisStore.locationList.map(loc => [loc.latitude, loc.longitude])
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  })
}

const handleReset = () => {
  searchForm.value = {
    keyword: '',
    type: '',
    radius: 5000
  }
  selectedLocation.value = null
  gisStore.fetchLocationList().then(() => {
    updateMarkers()
    map.setView([39.9042, 116.4074], 12)
  })
}

const handleSelectLocation = (location) => {
  selectedLocation.value = location
  if (map) {
    map.setView([location.latitude, location.longitude], 15)
  }
}

const handleViewDetail = (location) => {
  gisStore.fetchLocationDetail(location.id)
  handleSelectLocation(location)
}

const handleFocusLocation = (location) => {
  handleSelectLocation(location)
  ElMessage.success(`已定位到: ${location.name}`)
}

const handleAddToRoute = (location) => {
  router.push({
    path: '/gis/route',
    query: { addLocation: location.name }
  })
}

const handleSearchNearby = (location) => {
  nearbyForm.value.center = location
  nearbyDialogVisible.value = true
}

const formatRadius = (val) => {
  return `${val} 米`
}

const executeNearbySearch = () => {
  if (!nearbyForm.value.center) return
  
  nearbyLoading.value = true
  gisStore.searchNearbyLocations({
    lat: nearbyForm.value.center.latitude,
    lng: nearbyForm.value.center.longitude,
    radius: nearbyForm.value.radius,
    types: nearbyForm.value.types
  }).then((data) => {
    nearbyResults.value = data.list
    nearbyLoading.value = false
  }).catch(() => {
    nearbyLoading.value = false
  })
}

const calculateDistance = (point1, point2) => {
  const R = 6371
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180
  const dLng = (point2.longitude - point1.longitude) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

watch(mapViewMode, () => {
  updateTileLayer()
})

watch(() => gisStore.locationList, () => {
  updateMarkers()
}, { deep: true })

onMounted(() => {
  gisStore.fetchLocationList().then(() => {
    setTimeout(() => {
      initMap()
      updateMarkers()
    }, 100)
  })
})
</script>

<style scoped>
.gis-query {
  height: 100%;
}

.search-card, .results-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.map-controls {
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

.results-list {
  max-height: 400px;
  overflow-y: auto;
}

.result-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.result-item:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
}

.result-item.active {
  border-color: #409EFF;
  background-color: #ecf5ff;
}

.result-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 18px;
  margin-right: 12px;
  flex-shrink: 0;
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-name {
  font-weight: bold;
  font-size: 15px;
  color: #303133;
  margin-bottom: 4px;
}

.result-type {
  margin-bottom: 4px;
}

.result-address {
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex-shrink: 0;
}

.empty-result {
  padding: 40px;
}

.detail-card {
  margin-top: 20px;
}

.detail-actions {
  display: flex;
  gap: 10px;
}
</style>
