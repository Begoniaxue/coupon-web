<template>
  <div class="map-chart-wrapper">
    <div v-if="loading" class="chart-state">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    <div v-else-if="error" class="chart-state error">
      <el-icon><WarningFilled /></el-icon>
      <span>加载失败</span>
    </div>
    <div v-else-if="!data || !data.length" class="chart-state empty">
      <el-icon><DataLine /></el-icon>
      <span>暂无数据</span>
    </div>
    <div ref="chartRef" class="chart-container"></div>
    <div v-if="drillPath.length > 1" class="drill-navigation">
      <el-button
        v-for="(item, index) in drillPath"
        :key="item.code"
        size="small"
        type="primary"
        :plain="index !== drillPath.length - 1"
        @click="handleDrillBack(index)"
      >
        {{ item.name }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, shallowRef, nextTick } from 'vue'
import * as echarts from 'echarts'
import { Loading, WarningFilled, DataLine } from '@element-plus/icons-vue'
import { cachedFetch, debounce } from '@/utils/mockData'

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
  mapType: {
    type: String,
    default: 'china'
  },
  level: {
    type: String,
    default: 'country'
  },
  colors: {
    type: Array,
    default: () => ['#001a2b', '#003366', '#0066cc', '#0099ff', '#00ccff', '#66ffff']
  }
})

const emit = defineEmits(['click', 'drill', 'ready'])

const chartRef = ref(null)
const chartInstance = shallowRef(null)
const drillPath = ref([{ name: '全国', code: '100000', level: 'country' }])
let resizeObserver = null
let geoJsonCache = new Map()

const visualMapOption = computed(() => ({
  show: true,
  min: 0,
  max: 1000,
  left: '5%',
  bottom: '5%',
  text: ['高', '低'],
  textStyle: {
    color: 'rgba(255,255,255,0.7)'
  },
  inRange: {
    color: props.colors
  },
  calculable: true,
  seriesIndex: 0
}))

const loadGeoJson = async (mapName, code) => {
  const cacheKey = `${mapName}_${code}`
  if (geoJsonCache.has(cacheKey)) {
    return geoJsonCache.get(cacheKey)
  }

  try {
    const urls = {
      china: 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json',
      province: `https://geo.datav.aliyun.com/areas_v3/bound/${code}_full.json`,
      city: `https://geo.datav.aliyun.com/areas_v3/bound/${code}.json`
    }
    const url = urls[props.level] || urls.china

    const geoJson = await cachedFetch(`geo_${cacheKey}`, async () => {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to load GeoJSON')
      return response.json()
    }, 3600000)

    echarts.registerMap(mapName, geoJson)
    geoJsonCache.set(cacheKey, geoJson)
    return geoJson
  } catch (e) {
    console.warn('Failed to load external GeoJSON, using mock map:', e)
    const mockGeoJson = createMockChinaGeoJson()
    echarts.registerMap(mapName, mockGeoJson)
    geoJsonCache.set(cacheKey, mockGeoJson)
    return mockGeoJson
  }
}

const createMockChinaGeoJson = () => {
  const provinces = props.data.map(d => d.name)
  return {
    type: 'FeatureCollection',
    features: provinces.map((name, i) => {
      const angle = (i / provinces.length) * Math.PI * 2
      const r = 40 + Math.random() * 20
      const cx = 105 + Math.cos(angle) * r * 0.5
      const cy = 35 + Math.sin(angle) * r * 0.3
      return {
        type: 'Feature',
        properties: { name, adcode: `${100000 + i * 10000}` },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [cx - 3, cy - 2],
            [cx + 3, cy - 2],
            [cx + 3, cy + 2],
            [cx - 3, cy + 2],
            [cx - 3, cy - 2]
          ]]
        }
      }
    })
  }
}

const initChart = async () => {
  if (!chartRef.value) return

  if (chartInstance.value) {
    chartInstance.value.dispose()
  }

  chartInstance.value = echarts.init(chartRef.value, 'dark')

  const mapName = `map_${props.mapType}_${Date.now()}`
  await loadGeoJson(mapName, drillPath.value[drillPath.value.length - 1].code)

  chartInstance.value.setOption(getChartOption(mapName))

  chartInstance.value.on('click', handleMapClick)

  emit('ready', chartInstance.value)

  resizeObserver = new ResizeObserver(debounce(() => {
    chartInstance.value?.resize()
  }, 100))
  resizeObserver.observe(chartRef.value)
}

const getChartOption = (mapName) => {
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(13, 60, 84, 0.9)',
      borderColor: '#00b4ff',
      borderWidth: 1,
      textStyle: { color: '#fff' },
      formatter: (params) => {
        const value = params.value ?? 0
        return `<div style="font-weight: bold;">${params.name}</div>
                <div>数值: ${value.toLocaleString()}</div>
                <div>占比: ${((value / 5000) * 100).toFixed(2)}%</div>`
      }
    },
    visualMap: visualMapOption.value,
    geo: {
      map: mapName,
      roam: true,
      zoom: 1.2,
      label: {
        show: true,
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10
      },
      itemStyle: {
        borderColor: '#00b4ff',
        borderWidth: 1,
        areaColor: 'transparent'
      },
      emphasis: {
        itemStyle: {
          areaColor: '#00b4ff',
          shadowBlur: 20,
          shadowColor: '#00b4ff'
        },
        label: {
          color: '#fff',
          fontWeight: 'bold'
        }
      }
    },
    series: [
      {
        name: '数据分布',
        type: 'map',
        map: mapName,
        geoIndex: 0,
        data: props.data,
        roam: true,
        label: {
          show: false
        },
        itemStyle: {
          borderColor: '#00b4ff',
          borderWidth: 0.5
        }
      },
      {
        name: '散点',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        rippleEffect: {
          brushType: 'stroke',
          scale: 4
        },
        symbolSize: (val) => Math.max(8, val[2] / 50),
        itemStyle: {
          color: '#ffeb3b',
          shadowBlur: 10,
          shadowColor: '#ffeb3b'
        },
        data: props.data.slice(0, 10).map(d => {
          const feature = getFeatureByName(d.name)
          if (!feature) return null
          const coords = getCenterCoordinates(feature)
          return {
            name: d.name,
            value: [...coords, d.value],
            adcode: feature.properties?.adcode
          }
        }).filter(Boolean)
      }
    ]
  }
}

const getFeatureByName = (name) => {
  const cacheKey = `${props.mapType}_${drillPath.value[drillPath.value.length - 1].code}`
  const geoJson = geoJsonCache.get(cacheKey)
  if (!geoJson) return null
  return geoJson.features.find(f => f.properties?.name === name)
}

const getCenterCoordinates = (feature) => {
  if (!feature) return [104, 35]
  const geometry = feature.geometry
  if (geometry.type === 'Polygon') {
    const coords = geometry.coordinates[0]
    const xs = coords.map(c => c[0])
    const ys = coords.map(c => c[1])
    return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2]
  }
  return [104, 35]
}

const handleMapClick = (params) => {
  emit('click', params)

  if (params.componentType === 'series' && params.seriesType === 'map') {
    const feature = getFeatureByName(params.name)
    const adcode = feature?.properties?.adcode

    if (adcode) {
      const currentLevel = drillPath.value[drillPath.value.length - 1].level
      let nextLevel = currentLevel

      if (currentLevel === 'country') {
        nextLevel = 'province'
      } else if (currentLevel === 'province') {
        nextLevel = 'city'
      }

      if (nextLevel !== currentLevel) {
        drillPath.value.push({
          name: params.name,
          code: adcode,
          level: nextLevel
        })
        emit('drill', { level: nextLevel, code: adcode, name: params.name })
        refreshMap()
      }
    }
  }
}

const handleDrillBack = (index) => {
  drillPath.value = drillPath.value.slice(0, index + 1)
  const target = drillPath.value[drillPath.value.length - 1]
  emit('drill', { level: target.level, code: target.code, name: target.name })
  refreshMap()
}

const refreshMap = async () => {
  if (!chartInstance.value) return
  const mapName = `map_${props.mapType}_${Date.now()}`
  const target = drillPath.value[drillPath.value.length - 1]
  const levelProp = target.level

  try {
    const urls = {
      country: 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json',
      province: `https://geo.datav.aliyun.com/areas_v3/bound/${target.code}_full.json`,
      city: `https://geo.datav.aliyun.com/areas_v3/bound/${target.code}.json`
    }
    const url = urls[levelProp] || urls.china

    const geoJson = await cachedFetch(`geo_${target.code}`, async () => {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to load GeoJSON')
      return response.json()
    }, 3600000)

    echarts.registerMap(mapName, geoJson)
    geoJsonCache.set(target.code, geoJson)

    chartInstance.value.setOption({
      geo: { map: mapName },
      series: [
        { map: mapName, data: props.data },
        {
          data: props.data.slice(0, 10).map(d => {
            const feature = geoJson.features.find(f => f.properties?.name === d.name)
            if (!feature) return null
            const coords = getCenterCoordinates(feature)
            return { name: d.name, value: [...coords, d.value] }
          }).filter(Boolean)
        }
      ]
    })
  } catch (e) {
    console.warn('Drill GeoJSON load failed:', e)
  }
}

watch(() => props.data, () => {
  if (chartInstance.value) {
    chartInstance.value.setOption({
      series: [
        { data: props.data },
        {
          data: props.data.slice(0, 10).map(d => {
            const feature = getFeatureByName(d.name)
            if (!feature) return null
            const coords = getCenterCoordinates(feature)
            return { name: d.name, value: [...coords, d.value] }
          }).filter(Boolean)
        }
      ]
    })
  }
}, { deep: true })

onMounted(() => {
  nextTick(() => initChart())
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  if (chartInstance.value) {
    chartInstance.value.off('click')
    chartInstance.value.dispose()
    chartInstance.value = null
  }
})

defineExpose({
  getInstance: () => chartInstance.value,
  resize: () => chartInstance.value?.resize(),
  drillPath
})
</script>

<style scoped>
.map-chart-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.chart-container {
  width: 100%;
  height: 100%;
}

.chart-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.3);
}

.chart-state.error { color: #f56c6c; }
.chart-state.empty { color: #909399; }

.loading-icon {
  animation: spin 1s linear infinite;
  color: #409eff;
  font-size: 24px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.drill-navigation {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  gap: 8px;
  z-index: 5;
}
</style>
