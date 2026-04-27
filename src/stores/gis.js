import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getLocationList,
  getLocationDetail,
  searchNearby,
  getRouteList,
  calculateRoute,
  getHeatmapData,
  getBufferZones,
  createBufferZone,
  get3DLocations,
  getTerrainData
} from '@/api/gis'

export const useGisStore = defineStore('gis', () => {
  const locationList = ref([])
  const currentLocation = ref(null)
  const routeList = ref([])
  const currentRoute = ref(null)
  const heatmapData = ref([])
  const bufferZones = ref([])
  const locations3D = ref([])
  const terrainData = ref([])
  const nearbyResults = ref([])
  
  const total = ref(0)
  const loading = ref(false)
  const mapCenter = ref({ lat: 39.9042, lng: 116.4074 })
  const mapZoom = ref(12)
  const selectedMarkers = ref([])
  
  const locationTypes = [
    { value: '商业中心', label: '商业中心', color: '#409EFF' },
    { value: '景点', label: '景点', color: '#67C23A' },
    { value: '政府机构', label: '政府机构', color: '#E6A23C' }
  ]
  
  const travelModes = [
    { value: 'driving', label: '驾车', icon: 'car' },
    { value: 'walking', label: '步行', icon: 'walk' },
    { value: 'cycling', label: '骑行', icon: 'bicycle' }
  ]
  
  const getLocationTypeInfo = (type) => {
    return locationTypes.find(t => t.value === type) || locationTypes[0]
  }
  
  const fetchLocationList = async (params = {}) => {
    loading.value = true
    try {
      const res = await getLocationList({
        page: 1,
        pageSize: 10,
        ...params
      })
      locationList.value = res.data.list
      total.value = res.data.total
      return res.data
    } finally {
      loading.value = false
    }
  }
  
  const fetchLocationDetail = async (id) => {
    loading.value = true
    try {
      const res = await getLocationDetail(id)
      currentLocation.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }
  
  const searchNearbyLocations = async (params) => {
    loading.value = true
    try {
      const res = await searchNearby(params)
      nearbyResults.value = res.data.list
      return res.data
    } finally {
      loading.value = false
    }
  }
  
  const fetchRouteList = async (params = {}) => {
    loading.value = true
    try {
      const res = await getRouteList({
        page: 1,
        pageSize: 10,
        ...params
      })
      routeList.value = res.data.list
      total.value = res.data.total
      return res.data
    } finally {
      loading.value = false
    }
  }
  
  const calculateNewRoute = async (params) => {
    loading.value = true
    try {
      const res = await calculateRoute(params)
      currentRoute.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }
  
  const fetchHeatmapData = async () => {
    loading.value = true
    try {
      const res = await getHeatmapData()
      heatmapData.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }
  
  const fetchBufferZones = async () => {
    loading.value = true
    try {
      const res = await getBufferZones()
      bufferZones.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }
  
  const addBufferZone = async (params) => {
    loading.value = true
    try {
      const res = await createBufferZone(params)
      bufferZones.value.push(res.data)
      return res.data
    } finally {
      loading.value = false
    }
  }
  
  const fetch3DLocations = async () => {
    loading.value = true
    try {
      const res = await get3DLocations()
      locations3D.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }
  
  const fetchTerrainData = async (params) => {
    loading.value = true
    try {
      const res = await getTerrainData(params)
      terrainData.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }
  
  const setMapCenter = (lat, lng) => {
    mapCenter.value = { lat, lng }
  }
  
  const setMapZoom = (zoom) => {
    mapZoom.value = zoom
  }
  
  const selectMarker = (marker) => {
    if (!selectedMarkers.value.includes(marker)) {
      selectedMarkers.value.push(marker)
    }
  }
  
  const deselectMarker = (marker) => {
    const index = selectedMarkers.value.indexOf(marker)
    if (index > -1) {
      selectedMarkers.value.splice(index, 1)
    }
  }
  
  const clearSelectedMarkers = () => {
    selectedMarkers.value = []
  }
  
  const allLocationNames = computed(() => {
    return locationList.value.map(loc => loc.name)
  })
  
  return {
    locationList,
    currentLocation,
    routeList,
    currentRoute,
    heatmapData,
    bufferZones,
    locations3D,
    terrainData,
    nearbyResults,
    total,
    loading,
    mapCenter,
    mapZoom,
    selectedMarkers,
    locationTypes,
    travelModes,
    allLocationNames,
    getLocationTypeInfo,
    fetchLocationList,
    fetchLocationDetail,
    searchNearbyLocations,
    fetchRouteList,
    calculateNewRoute,
    fetchHeatmapData,
    fetchBufferZones,
    addBufferZone,
    fetch3DLocations,
    fetchTerrainData,
    setMapCenter,
    setMapZoom,
    selectMarker,
    deselectMarker,
    clearSelectedMarkers
  }
})
