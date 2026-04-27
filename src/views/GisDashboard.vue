<template>
  <div class="gis-dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <el-icon><Location /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalLocations }}</div>
              <div class="stat-label">地理标记点</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
              <el-icon><Guide /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalRoutes }}</div>
              <div class="stat-label">规划路径</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalAnalysis }}</div>
              <div class="stat-label">空间分析</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
              <el-icon><View /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total3DModels }}</div>
              <div class="stat-label">3D模型</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="16">
        <el-card class="map-card">
          <template #header>
            <div class="card-header">
              <span>地图总览</span>
              <el-tag type="primary">实时更新</el-tag>
            </div>
          </template>
          <div ref="mapContainer" class="map-container">
            <div v-if="mapLoading" class="map-loading">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>加载地图中...</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="quick-actions-card">
          <template #header>
            <span>快捷操作</span>
          </template>
          <div class="quick-actions">
            <el-button 
              type="primary" 
              size="large" 
              class="action-btn" 
              @click="navigateTo('/gis/query')"
            >
              <el-icon><Search /></el-icon>
              <span>地理信息查询</span>
            </el-button>
            <el-button 
              type="success" 
              size="large" 
              class="action-btn" 
              @click="navigateTo('/gis/analysis')"
            >
              <el-icon><TrendCharts /></el-icon>
              <span>空间分析</span>
            </el-button>
            <el-button 
              type="warning" 
              size="large" 
              class="action-btn" 
              @click="navigateTo('/gis/route')"
            >
              <el-icon><Guide /></el-icon>
              <span>路径规划</span>
            </el-button>
            <el-button 
              type="danger" 
              size="large" 
              class="action-btn" 
              @click="navigateTo('/gis/3d')"
            >
              <el-icon><View /></el-icon>
              <span>三维可视化</span>
            </el-button>
          </div>
        </el-card>

        <el-card class="recent-activity-card" style="margin-top: 20px;">
          <template #header>
            <span>最近活动</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="activity in recentActivities"
              :key="activity.id"
              :timestamp="activity.time"
              placement="top"
              :type="activity.type"
            >
              <el-card>
                <h4>{{ activity.title }}</h4>
                <p>{{ activity.description }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>位置类型分布</span>
          </template>
          <div class="chart-placeholder">
            <div class="chart-legend">
              <div class="legend-item" v-for="type in locationTypeStats" :key="type.value">
                <div class="legend-color" :style="{ backgroundColor: type.color }"></div>
                <span>{{ type.label }}: {{ type.count }}个</span>
              </div>
            </div>
            <div class="chart-bars">
              <div 
                class="chart-bar" 
                v-for="type in locationTypeStats" 
                :key="type.value"
                :style="{ 
                  width: (type.count / maxLocationCount * 100) + '%',
                  backgroundColor: type.color 
                }"
              >
                <span>{{ type.count }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>热门位置</span>
          </template>
          <el-table :data="hotLocations" style="width: 100%">
            <el-table-column prop="rank" label="排名" width="70">
              <template #default="{ row }">
                <el-tag :type="row.rank <= 3 ? 'danger' : 'info'">{{ row.rank }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="type" label="类型" width="120">
              <template #default="{ row }">
                <el-tag size="small">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="views" label="访问量" width="120">
              <template #default="{ row }">
                <span>{{ row.views.toLocaleString() }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useGisStore } from '@/stores/gis'
import L from 'leaflet'

const router = useRouter()
const gisStore = useGisStore()

const mapContainer = ref(null)
const mapLoading = ref(true)
let map = null

const stats = ref({
  totalLocations: 8,
  totalRoutes: 3,
  totalAnalysis: 5,
  total3DModels: 8
})

const recentActivities = ref([
  {
    id: 1,
    title: '新增地理标记',
    description: '在北京市朝阳区新增商业中心标记点',
    time: '2024-04-25 14:30',
    type: 'success'
  },
  {
    id: 2,
    title: '路径规划完成',
    description: '完成上海一日游路径规划，包含5个途经点',
    time: '2024-04-25 11:20',
    type: 'primary'
  },
  {
    id: 3,
    title: '空间分析报告',
    description: '生成深圳南山区商圈缓冲区分析报告',
    time: '2024-04-24 16:45',
    type: 'warning'
  }
])

const locationTypeStats = ref([
  { value: '商业中心', label: '商业中心', color: '#409EFF', count: 4 },
  { value: '景点', label: '景点', color: '#67C23A', count: 3 },
  { value: '政府机构', label: '政府机构', color: '#E6A23C', count: 1 }
])

const hotLocations = ref([
  { rank: 1, name: '北京天安门', type: '景点', views: 12580 },
  { rank: 2, name: '上海外滩', type: '景点', views: 9870 },
  { rank: 3, name: '万达广场', type: '商业中心', views: 8750 },
  { rank: 4, name: '广州塔', type: '景点', views: 6540 },
  { rank: 5, name: '银泰中心', type: '商业中心', views: 5420 }
])

const maxLocationCount = computed(() => {
  return Math.max(...locationTypeStats.value.map(t => t.count))
})

const initMap = () => {
  if (!mapContainer.value) {
    console.warn('地图容器不存在，跳过初始化')
    return
  }
  
  if (map) {
    console.warn('地图已存在，跳过重复初始化')
    return
  }
  
  console.log('开始初始化地图...')
  
  try {
    map = L.map(mapContainer.value, {
      center: [39.9042, 116.4074],
      zoom: 12,
      zoomControl: true
    })
    
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 17,
      minZoom: 3,
      noWrap: true,
      errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAAWdEVYdENyZWF0aW9uIFRpbWUAMjAyNi0wNC0yN1RNNDoyNjoyNyswODowMG9418sAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAN/SURBVO3YMQ0AIAwEsf+/h6YwKJO6RzfsQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACg0+6aNl6X73+hQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALC49wMAAP//zQsAAAD//xEAAAAA//8EAAAAAP//BA==',
      maxNativeZoom: 17
    }).addTo(map)
    
    const markers = [
      { lat: 39.9042, lng: 116.4074, name: '万达广场', type: '商业中心' },
      { lat: 39.9087, lng: 116.4474, name: '银泰中心', type: '商业中心' },
      { lat: 39.9055, lng: 116.4050, name: '北京天安门', type: '景点' },
      { lat: 31.2304, lng: 121.4737, name: '恒隆广场', type: '商业中心' },
      { lat: 31.2397, lng: 121.4900, name: '上海外滩', type: '景点' },
      { lat: 22.5431, lng: 114.0579, name: '万象城', type: '商业中心' },
      { lat: 22.5431, lng: 114.0579, name: '深圳市民中心', type: '政府机构' },
      { lat: 23.1067, lng: 113.3245, name: '广州塔', type: '景点' }
    ]
    
    markers.forEach(marker => {
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width: 30px;
          height: 30px;
          background-color: ${getMarkerColor(marker.type)};
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: bold;
        ">${marker.name.charAt(0)}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      })
      
      const m = L.marker([marker.lat, marker.lng], { icon: customIcon }).addTo(map)
      m.bindPopup(`<b>${marker.name}</b><br>${marker.type}`)
    })
    
    map.whenReady(() => {
      console.log('地图初始化完成')
      mapLoading.value = false
      map.invalidateSize()
    })
    
  } catch (error) {
    console.error('地图初始化失败:', error)
    mapLoading.value = false
  }
}

const destroyMap = () => {
  if (map) {
    console.log('销毁地图实例')
    map.remove()
    map = null
  }
}

const getMarkerColor = (type) => {
  const colors = {
    '商业中心': '#409EFF',
    '景点': '#67C23A',
    '政府机构': '#E6A23C'
  }
  return colors[type] || '#409EFF'
}

const navigateTo = (path) => {
  router.push(path)
}

onMounted(() => {
  gisStore.fetchLocationList()
  
  nextTick(() => {
    console.log('DOM已渲染，开始初始化地图')
    if (mapContainer.value) {
      console.log('地图容器存在:', mapContainer.value)
      console.log('容器尺寸:', mapContainer.value.offsetWidth, mapContainer.value.offsetHeight)
      initMap()
    } else {
      console.error('地图容器不存在')
    }
  })
})

onUnmounted(() => {
  destroyMap()
})
</script>

<style scoped>
.gis-dashboard {
  height: 100%;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.stat-icon .el-icon {
  font-size: 30px;
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.map-card {
  height: 500px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.quick-actions-card {
  height: 250px;
}

.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  height: 100%;
}

.action-btn {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.action-btn .el-icon {
  font-size: 28px;
}

.recent-activity-card {
  height: 230px;
}

.chart-placeholder {
  padding: 20px;
}

.chart-legend {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.chart-bars {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.chart-bar {
  height: 30px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 10px;
  min-width: 40px;
  transition: width 0.5s ease;
}

.chart-bar span {
  color: white;
  font-weight: bold;
}
</style>

<style>
.leaflet-container {
  width: 100%;
  height: 100%;
  z-index: 1;
}

.leaflet-tile {
  filter: inherit;
}

.leaflet-control-zoom {
  z-index: 1000;
}

.leaflet-popup {
  z-index: 1000;
}

.map-container .leaflet-container {
  border-radius: 4px;
}
</style>
