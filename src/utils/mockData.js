export const mockApi = {
  delay(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms))
  },

  async getOverview() {
    await this.delay(300)
    return {
      totalUsers: Math.floor(Math.random() * 1000000) + 500000,
      activeUsers: Math.floor(Math.random() * 500000) + 200000,
      totalOrders: Math.floor(Math.random() * 200000) + 100000,
      totalRevenue: Math.floor(Math.random() * 50000000) + 20000000,
      growthRate: Number((Math.random() * 30 + 5).toFixed(2)),
      conversionRate: Number((Math.random() * 10 + 2).toFixed(2))
    }
  },

  async getTrendData() {
    await this.delay(400)
    const days = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    return {
      xAxis: days,
      series: [
        {
          name: '销售额',
          type: 'line',
          data: days.map(() => Math.floor(Math.random() * 500) + 200)
        },
        {
          name: '订单量',
          type: 'line',
          data: days.map(() => Math.floor(Math.random() * 300) + 100)
        },
        {
          name: '用户量',
          type: 'line',
          data: days.map(() => Math.floor(Math.random() * 800) + 400)
        }
      ]
    }
  },

  async getBarData() {
    await this.delay(300)
    const regions = ['华东', '华南', '华北', '西南', '西北', '东北', '华中']
    return {
      xAxis: regions,
      series: [
        {
          name: '2024年',
          type: 'bar',
          stack: 'total',
          data: regions.map(() => Math.floor(Math.random() * 200) + 100)
        },
        {
          name: '2025年',
          type: 'bar',
          stack: 'total',
          data: regions.map(() => Math.floor(Math.random() * 250) + 150)
        }
      ]
    }
  },

  async getPieData() {
    await this.delay(200)
    const categories = ['电子产品', '服装配饰', '食品饮料', '家居用品', '美妆个护', '运动户外']
    return categories.map((name, i) => ({
      name,
      value: Math.floor(Math.random() * 5000) + 1000,
      itemStyle: {
        color: [
          '#5470c6', '#91cc75', '#fac858', '#ee6666',
          '#73c0de', '#3ba272', '#fc8452', '#9a60b4'
        ][i]
      }
    }))
  },

  async getRadarData() {
    await this.delay(200)
    return {
      indicator: [
        { name: '销售能力', max: 100 },
        { name: '用户增长', max: 100 },
        { name: '产品质量', max: 100 },
        { name: '服务水平', max: 100 },
        { name: '品牌影响力', max: 100 },
        { name: '技术创新', max: 100 }
      ],
      series: [
        {
          name: '2024年',
          value: [85, 72, 90, 88, 75, 68]
        },
        {
          name: '2025年',
          value: [92, 88, 95, 90, 82, 78]
        }
      ]
    }
  },

  async getGaugeData() {
    await this.delay(200)
    return {
      cpu: Number((Math.random() * 40 + 30).toFixed(1)),
      memory: Number((Math.random() * 30 + 50).toFixed(1)),
      disk: Number((Math.random() * 20 + 40).toFixed(1)),
      network: Number((Math.random() * 50 + 20).toFixed(1))
    }
  },

  async getMapData(level = 'country', code = '100000') {
    await this.delay(400)
    if (level === 'country') {
      const provinces = [
        '北京', '天津', '上海', '重庆', '河北', '河南', '云南', '辽宁',
        '黑龙江', '湖南', '安徽', '山东', '新疆', '江苏', '浙江', '江西',
        '湖北', '广西', '甘肃', '山西', '内蒙古', '陕西', '吉林', '福建',
        '贵州', '广东', '青海', '西藏', '四川', '宁夏', '海南', '台湾',
        '香港', '澳门'
      ]
      return provinces.map(name => ({
        name,
        value: Math.floor(Math.random() * 1000) + 100
      }))
    } else {
      const cities = ['市辖区1', '市辖区2', '市辖区3', '市辖区4', '市辖区5', '市辖区6']
      return cities.map((name, i) => ({
        name,
        value: Math.floor(Math.random() * 500) + 50,
        adcode: `${code}${String(i + 1).padStart(2, '0')}`
      }))
    }
  },

  async getAlertList() {
    await this.delay(200)
    const types = ['error', 'warning', 'info', 'success']
    const messages = [
      '服务器CPU使用率超过80%',
      '数据库连接池接近上限',
      '用户登录异常检测',
      '订单处理延迟警告',
      '库存不足提醒',
      '支付接口响应超时',
      '系统资源使用率正常',
      '数据同步完成'
    ]
    return Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      type: types[Math.floor(Math.random() * types.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      time: new Date(Date.now() - Math.random() * 3600000).toLocaleTimeString(),
      source: ['系统监控', '业务告警', '安全中心', '数据分析'][Math.floor(Math.random() * 4)]
    })).sort((a, b) => {
      const order = { error: 0, warning: 1, info: 2, success: 3 }
      return order[a.type] - order[b.type]
    })
  },

  async getProgressData() {
    await this.delay(200)
    return [
      { name: '销售目标', value: Math.floor(Math.random() * 30 + 70), total: 100 },
      { name: '用户增长', value: Math.floor(Math.random() * 40 + 60), total: 100 },
      { name: '订单完成', value: Math.floor(Math.random() * 20 + 80), total: 100 },
      { name: '系统稳定性', value: Math.floor(Math.random() * 10 + 90), total: 100 }
    ]
  }
}

export const createWebSocketMock = () => {
  let intervalId = null
  const listeners = new Set()

  const connect = () => {
    console.log('[WebSocket Mock] Connected')
    intervalId = setInterval(() => {
      const data = {
        timestamp: Date.now(),
        realtimeOrders: Math.floor(Math.random() * 100),
        realtimeRevenue: Math.floor(Math.random() * 50000),
        activeUsers: Math.floor(Math.random() * 10000)
      }
      listeners.forEach(fn => fn(data))
    }, 3000)
  }

  const subscribe = (fn) => {
    listeners.add(fn)
  }

  const unsubscribe = (fn) => {
    listeners.delete(fn)
  }

  const disconnect = () => {
    if (intervalId) clearInterval(intervalId)
    listeners.clear()
    console.log('[WebSocket Mock] Disconnected')
  }

  return { connect, disconnect, subscribe, unsubscribe }
}

export const dataCache = new Map()

export const cachedFetch = async (key, fetcher, ttl = 5000) => {
  const cached = dataCache.get(key)
  const now = Date.now()

  if (cached && now - cached.timestamp < ttl) {
    return cached.data
  }

  const data = await fetcher()
  dataCache.set(key, { data, timestamp: now })
  return data
}

export function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

export function throttle(fn, delay = 500) {
  let last = 0
  return function (...args) {
    const now = Date.now()
    if (now - last >= delay) {
      last = now
      fn.apply(this, args)
    }
  }
}
