<template>
  <div class="test-map">
    <h1>测试地图页面</h1>
    <el-card>
      <template #header>
        <span>使用 @vue-leaflet/vue-leaflet</span>
      </template>
      <div class="map-wrapper">
        <l-map
          ref="mapRef"
          :zoom="12"
          :center="center"
          style="width: 100%; height: 400px;"
          @ready="onMapReady"
        >
          <l-tile-layer
            :url="url"
            :attribution="attribution"
            :max-zoom="17"
            :max-native-zoom="17"
            :min-zoom="3"
            :no-wrap="true"
          />
          <l-marker :lat-lng="markerPosition">
            <l-popup>
              <div>这是一个测试标记点</div>
              <div>北京天安门</div>
            </l-popup>
          </l-marker>
          <l-circle
            :lat-lng="circleCenter"
            :radius="1000"
            color="#409EFF"
            fill-color="#409EFF"
            :fill-opacity="0.3"
          >
            <l-popup>
              半径1公里的圆形区域
            </l-popup>
          </l-circle>
        </l-map>
      </div>
    </el-card>

    <el-card style="margin-top: 20px;">
      <template #header>
        <span>使用原生 Leaflet</span>
      </template>
      <div ref="nativeMapContainer" class="native-map-wrapper">
        <div v-if="nativeMapLoading" class="loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载中...</span>
        </div>
      </div>
    </el-card>

    <el-card style="margin-top: 20px;">
      <template #header>
        <span>调试信息</span>
      </template>
      <div class="debug-info">
        <div><strong>@vue-leaflet 地图就绪:</strong> {{ vueLeafletReady }}</div>
        <div><strong>原生 Leaflet 地图就绪:</strong> {{ nativeLeafletReady }}</div>
        <div><strong>地图中心:</strong> {{ center }}</div>
        <div><strong>瓦片URL:</strong> {{ url }}</div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import L from 'leaflet'
import { LMap, LTileLayer, LMarker, LPopup, LCircle } from '@vue-leaflet/vue-leaflet'

const mapRef = ref(null)
const nativeMapContainer = ref(null)
const vueLeafletReady = ref(false)
const nativeLeafletReady = ref(false)
const nativeMapLoading = ref(true)

const center = ref([39.9042, 116.4074])
const markerPosition = ref([39.9042, 116.4074])
const circleCenter = ref([39.9087, 116.4474])

const url = ref('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}')
const attribution = ref('Tiles &copy; Esri')
const tileOptions = ref({
  maxZoom: 17,
  maxNativeZoom: 17,
  minZoom: 3,
  noWrap: true
})

const onMapReady = () => {
  console.log('@vue-leaflet 地图就绪')
  vueLeafletReady.value = true
}

const initNativeMap = () => {
  if (!nativeMapContainer.value) {
    console.error('原生地图容器不存在')
    return
  }
  
  console.log('初始化原生 Leaflet 地图...')
  console.log('容器:', nativeMapContainer.value)
  console.log('容器尺寸:', nativeMapContainer.value.offsetWidth, nativeMapContainer.value.offsetHeight)
  
  try {
    const map = L.map(nativeMapContainer.value).setView([39.9042, 116.4074], 12)
    
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 17,
      maxNativeZoom: 17,
      minZoom: 3,
      noWrap: true,
      errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAAWdEVYdENyZWF0aW9uIFRpbWUAMjAyNi0wNC0yN1RNNDoyNjoyNyswODowMG9418sAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAN/SURBVO3YMQ0AIAwEsf+/h6YwKJO6RzfsQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACg0+6aNl6X73+hQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALC49wMAAP//zQsAAAD//xEAAAAA//8EAAAAAP//BA=='
    }).addTo(map)
    
    const customIcon = L.divIcon({
      className: 'test-marker',
      html: '<div style="width: 30px; height: 30px; background-color: #409EFF; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    })
    
    L.marker([39.9042, 116.4074], { icon: customIcon }).addTo(map)
      .bindPopup('原生 Leaflet 测试标记')
    
    map.whenReady(() => {
      console.log('原生 Leaflet 地图就绪')
      nativeLeafletReady.value = true
      nativeMapLoading.value = false
      map.invalidateSize()
    })
    
  } catch (error) {
    console.error('原生 Leaflet 初始化失败:', error)
    nativeMapLoading.value = false
  }
}

onMounted(() => {
  console.log('TestMap 组件挂载')
  console.log('Leaflet 版本:', L.version)
  
  nextTick(() => {
    console.log('DOM 已更新')
    initNativeMap()
  })
})
</script>

<style scoped>
.test-map {
  padding: 20px;
}

.map-wrapper {
  width: 100%;
  height: 400px;
}

.native-map-wrapper {
  width: 100%;
  height: 400px;
  position: relative;
  background-color: #f5f7fa;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.loading .el-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.debug-info {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  line-height: 2;
}

.debug-info div {
  padding: 5px 0;
  border-bottom: 1px solid #ebeef5;
}

.debug-info div:last-child {
  border-bottom: none;
}
</style>

<style>
@import 'leaflet/dist/leaflet.css';
</style>
