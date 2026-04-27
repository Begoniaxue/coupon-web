const mockLocations = [
  {
    id: 1,
    name: '万达广场',
    type: '商业中心',
    latitude: 39.9042,
    longitude: 116.4074,
    address: '北京市朝阳区建国路88号',
    description: '大型商业综合体',
    tags: ['购物', '餐饮', '娱乐']
  },
  {
    id: 2,
    name: '银泰中心',
    type: '商业中心',
    latitude: 39.9087,
    longitude: 116.4474,
    address: '北京市朝阳区建国门外大街2号',
    description: '高端购物中心',
    tags: ['高端', '购物', '办公']
  },
  {
    id: 3,
    name: '恒隆广场',
    type: '商业中心',
    latitude: 31.2304,
    longitude: 121.4737,
    address: '上海市静安区南京西路1266号',
    description: '上海核心商圈',
    tags: ['购物', '时尚']
  },
  {
    id: 4,
    name: '万象城',
    type: '商业中心',
    latitude: 22.5431,
    longitude: 114.0579,
    address: '深圳市南山区科苑南路2888号',
    description: '深圳大型商业项目',
    tags: ['购物', '娱乐', '餐饮']
  },
  {
    id: 5,
    name: '北京天安门',
    type: '景点',
    latitude: 39.9055,
    longitude: 116.4050,
    address: '北京市东城区天安门广场',
    description: '中国首都标志性建筑',
    tags: ['景点', '历史']
  },
  {
    id: 6,
    name: '上海外滩',
    type: '景点',
    latitude: 31.2397,
    longitude: 121.4900,
    address: '上海市黄浦区中山东一路',
    description: '上海标志性景点',
    tags: ['景点', '夜景']
  },
  {
    id: 7,
    name: '深圳市民中心',
    type: '政府机构',
    latitude: 22.5431,
    longitude: 114.0579,
    address: '深圳市福田区福中三路',
    description: '深圳市政府所在地',
    tags: ['政府', '地标']
  },
  {
    id: 8,
    name: '广州塔',
    type: '景点',
    latitude: 23.1067,
    longitude: 113.3245,
    address: '广州市海珠区阅江西路222号',
    description: '广州地标建筑',
    tags: ['景点', '地标', '观光']
  }
]

const mockRoutes = [
  {
    id: 1,
    name: '北京一日游',
    startPoint: '北京天安门',
    endPoint: '万达广场',
    waypoints: ['银泰中心'],
    distance: 8.5,
    duration: 45,
    description: '经典北京城区路线'
  },
  {
    id: 2,
    name: '上海购物游',
    startPoint: '上海外滩',
    endPoint: '恒隆广场',
    waypoints: [],
    distance: 5.2,
    duration: 25,
    description: '上海核心商圈路线'
  },
  {
    id: 3,
    name: '深圳观光游',
    startPoint: '深圳市民中心',
    endPoint: '万象城',
    waypoints: [],
    distance: 3.8,
    duration: 15,
    description: '深圳新城区路线'
  }
]

const mockAnalysisData = {
  heatmapData: [
    { lat: 39.9042, lng: 116.4074, intensity: 0.9 },
    { lat: 39.9087, lng: 116.4474, intensity: 0.8 },
    { lat: 31.2304, lng: 121.4737, intensity: 0.7 },
    { lat: 22.5431, lng: 114.0579, intensity: 0.6 },
    { lat: 39.9055, lng: 116.4050, intensity: 0.95 },
    { lat: 31.2397, lng: 121.4900, intensity: 0.85 },
    { lat: 23.1067, lng: 113.3245, intensity: 0.75 }
  ],
  bufferZones: [
    {
      id: 1,
      name: '万达广场商圈',
      center: { lat: 39.9042, lng: 116.4074 },
      radius: 2000,
      area: '12.57 平方公里'
    },
    {
      id: 2,
      name: '上海外滩商圈',
      center: { lat: 31.2397, lng: 121.4900 },
      radius: 1500,
      area: '7.07 平方公里'
    }
  ]
}

export const getLocationList = (params = {}) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let filteredList = [...mockLocations]
      
      if (params.keyword) {
        filteredList = filteredList.filter(item => 
          item.name.includes(params.keyword) || 
          item.address.includes(params.keyword)
        )
      }
      
      if (params.type) {
        filteredList = filteredList.filter(item => item.type === params.type)
      }
      
      const page = params.page || 1
      const pageSize = params.pageSize || 10
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      
      const list = filteredList.slice(startIndex, endIndex)
      
      resolve({
        code: 200,
        data: {
          list,
          total: filteredList.length,
          page,
          pageSize
        },
        message: 'success'
      })
    }, 300)
  })
}

export const getLocationDetail = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const location = mockLocations.find(item => item.id === Number(id))
      if (location) {
        resolve({
          code: 200,
          data: location,
          message: 'success'
        })
      } else {
        reject({
          code: 404,
          message: '位置不存在'
        })
      }
    }, 200)
  })
}

export const searchNearby = (params) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const { lat, lng, radius = 5000, type } = params
      
      let results = mockLocations.filter(item => {
        const distance = calculateDistance(lat, lng, item.latitude, item.longitude)
        return distance <= radius
      })
      
      if (type) {
        results = results.filter(item => item.type === type)
      }
      
      resolve({
        code: 200,
        data: {
          list: results,
          total: results.length
        },
        message: 'success'
      })
    }, 300)
  })
}

export const getRouteList = (params = {}) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let filteredList = [...mockRoutes]
      
      if (params.keyword) {
        filteredList = filteredList.filter(item => 
          item.name.includes(params.keyword)
        )
      }
      
      const page = params.page || 1
      const pageSize = params.pageSize || 10
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      
      const list = filteredList.slice(startIndex, endIndex)
      
      resolve({
        code: 200,
        data: {
          list,
          total: filteredList.length,
          page,
          pageSize
        },
        message: 'success'
      })
    }, 300)
  })
}

export const calculateRoute = (params) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const { startPoint, endPoint, waypoints = [], mode = 'driving' } = params
      
      const startLocation = mockLocations.find(l => l.name === startPoint)
      const endLocation = mockLocations.find(l => l.name === endPoint)
      
      const waypointLocations = waypoints.map(name => 
        mockLocations.find(l => l.name === name)
      ).filter(Boolean)
      
      if (!startLocation || !endLocation) {
        resolve({
          code: 400,
          message: '起点或终点不存在'
        })
        return
      }
      
      let totalDistance = 0
      let totalDuration = 0
      const pathCoordinates = [
        [startLocation.longitude, startLocation.latitude]
      ]
      
      waypointLocations.forEach(wp => {
        pathCoordinates.push([wp.longitude, wp.latitude])
      })
      
      pathCoordinates.push([endLocation.longitude, endLocation.latitude])
      
      for (let i = 1; i < pathCoordinates.length; i++) {
        const dist = calculateDistance(
          pathCoordinates[i-1][1], pathCoordinates[i-1][0],
          pathCoordinates[i][1], pathCoordinates[i][0]
        )
        totalDistance += dist
      }
      
      const speedMultiplier = mode === 'driving' ? 1 : mode === 'walking' ? 0.2 : 0.5
      totalDuration = Math.round(totalDistance * 10 / speedMultiplier)
      
      resolve({
        code: 200,
        data: {
          startPoint: startLocation,
          endPoint: endLocation,
          waypoints: waypointLocations,
          path: pathCoordinates,
          distance: totalDistance,
          duration: totalDuration,
          mode
        },
        message: 'success'
      })
    }, 500)
  })
}

export const getHeatmapData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        data: mockAnalysisData.heatmapData,
        message: 'success'
      })
    }, 300)
  })
}

export const getBufferZones = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        data: mockAnalysisData.bufferZones,
        message: 'success'
      })
    }, 300)
  })
}

export const createBufferZone = (params) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newZone = {
        id: mockAnalysisData.bufferZones.length + 1,
        name: params.name,
        center: { lat: params.lat, lng: params.lng },
        radius: params.radius,
        area: `${(Math.PI * params.radius * params.radius / 1000000).toFixed(2)} 平方公里`
      }
      
      mockAnalysisData.bufferZones.push(newZone)
      
      resolve({
        code: 200,
        data: newZone,
        message: '缓冲区创建成功'
      })
    }, 500)
  })
}

const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export const get3DLocations = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const locations3D = mockLocations.map(loc => ({
        ...loc,
        height: loc.type === '景点' ? 50 : Math.floor(Math.random() * 100) + 30,
        extrusionHeight: Math.floor(Math.random() * 50) + 10
      }))
      
      resolve({
        code: 200,
        data: locations3D,
        message: 'success'
      })
    }, 300)
  })
}

export const getTerrainData = (params) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const { centerLat, centerLng, radius = 10000 } = params
      
      const terrainPoints = []
      const gridSize = 10
      const step = radius / gridSize / 111000
      
      for (let i = 0; i <= gridSize; i++) {
        for (let j = 0; j <= gridSize; j++) {
          terrainPoints.push({
            lat: centerLat - radius/2/111000 + i * step,
            lng: centerLng - radius/2/111000 + j * step,
            elevation: Math.floor(Math.random() * 100) + 10
          })
        }
      }
      
      resolve({
        code: 200,
        data: terrainPoints,
        message: 'success'
      })
    }, 500)
  })
}
