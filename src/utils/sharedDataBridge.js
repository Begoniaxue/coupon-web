(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory)
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory()
  } else {
    root.SharedDataBridge = factory()
  }
}(typeof self !== 'undefined' ? self : this, function () {
  const STORAGE_KEY = 'shared_coupon_flashsale_data'
  
  const defaultData = {
    coupons: [
      {
        id: 1,
        name: '新人专享优惠券',
        code: 'NEW2024',
        type: 1,
        value: 50,
        minAmount: 200,
        quantity: 100,
        usedQuantity: 25,
        startTime: '2024-01-01 00:00:00',
        endTime: '2024-12-31 23:59:59',
        status: 1,
        weight: 10,
        projectId: 1,
        projectName: '万达广场',
        mainImage: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        contentImages: [],
        description: '这是一张新人专享优惠券，满200减50，全场通用。',
        createTime: '2024-01-01 10:00:00'
      },
      {
        id: 2,
        name: '会员折扣券',
        code: 'VIP10',
        type: 2,
        value: 8,
        minAmount: 0,
        quantity: 500,
        usedQuantity: 150,
        startTime: '2026-01-01 00:00:00',
        endTime: '2026-12-31 23:59:59',
        status: 1,
        weight: 5,
        projectId: 2,
        projectName: '银泰中心',
        mainImage: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        contentImages: [],
        description: '会员专享8折优惠券，无门槛使用。',
        createTime: '2026-01-02 14:30:00'
      },
      {
        id: 4,
        name: '限时特惠折扣券',
        code: 'SALE20',
        type: 2,
        value: 9,
        minAmount: 100,
        quantity: 1000,
        usedQuantity: 50,
        startTime: '2026-04-01 00:00:00',
        endTime: '2026-06-30 23:59:59',
        status: 1,
        weight: 8,
        projectId: 1,
        projectName: '万达广场',
        mainImage: 'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg',
        contentImages: [],
        description: '限时特惠9折优惠券，满100元可用。',
        createTime: '2026-03-15 10:00:00'
      },
      {
        id: 3,
        name: '满减优惠券',
        code: 'FULL100',
        type: 1,
        value: 100,
        minAmount: 500,
        quantity: 200,
        usedQuantity: 0,
        startTime: '2024-02-01 00:00:00',
        endTime: '2024-03-01 23:59:59',
        status: 0,
        weight: 8,
        projectId: null,
        projectName: '',
        mainImage: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        contentImages: [],
        description: '满500减100，限时优惠。',
        createTime: '2024-01-15 09:00:00'
      }
    ],
    flashSales: [
      {
        id: 1,
        title: '限时秒杀活动',
        subtitle: '全场商品低至5折起',
        mainImage: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        content: '<p>这是限时秒杀活动的详情内容</p><p>规则说明：</p><ul><li>每人限购一件</li><li>先到先得，售完即止</li><li>不与其他优惠叠加</li></ul>',
        projectId: 1,
        projectName: '万达广场',
        couponId: 2,
        couponName: '会员折扣券',
        startTime: new Date(Date.now() - 3600000 * 24).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
        endTime: new Date(Date.now() + 3600000 * 24 * 6).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
        createTime: new Date(Date.now() - 3600000 * 24 * 2).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
        status: 1,
        seckillConfig: {
          originalAmount: 100,
          seckillAmount: 9.9,
          stock: 100,
          soldCount: 35,
          limitPerUser: 1,
          expireDate: '2026-06-30'
        }
      },
      {
        id: 2,
        title: '周末特惠秒杀',
        subtitle: '周末狂欢，限时折扣',
        mainImage: 'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg',
        content: '<p>周末特惠秒杀活动，错过再等一周！</p>',
        projectId: 2,
        projectName: '银泰中心',
        couponId: 2,
        couponName: '会员折扣券',
        startTime: new Date(Date.now() - 3600000 * 48).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
        endTime: new Date(Date.now() - 3600000 * 24).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
        createTime: new Date(Date.now() - 3600000 * 72).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
        status: 2,
        seckillConfig: {
          originalAmount: 120,
          seckillAmount: 19.9,
          stock: 50,
          soldCount: 50,
          limitPerUser: 1,
          expireDate: '2026-06-30'
        }
      },
      {
        id: 3,
        title: '即将开始的秒杀',
        subtitle: '敬请期待',
        mainImage: 'https://fuss10.elemecdn.com/2/11/6535bcfb26e4c79b48ddde44f476fpeg.png',
        content: '<p>即将开始的秒杀活动内容</p>',
        projectId: null,
        projectName: '',
        couponId: 4,
        couponName: '限时特惠折扣券',
        startTime: new Date(Date.now() + 3600000 * 24).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
        endTime: new Date(Date.now() + 3600000 * 24 * 5).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
        createTime: new Date(Date.now()).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
        status: 0,
        seckillConfig: {
          originalAmount: 80,
          seckillAmount: 15.9,
          stock: 200,
          soldCount: 0,
          limitPerUser: 1,
          expireDate: '2026-06-30'
        }
      }
    ],
    nextCouponId: 5,
    nextFlashSaleId: 4
  }
  
  let cachedData = null
  
  const getStorage = () => {
    if (typeof uni !== 'undefined' && uni.getStorageSync) {
      return {
        get: (key) => uni.getStorageSync(key),
        set: (key, value) => uni.setStorageSync(key, value),
        remove: (key) => uni.removeStorageSync(key)
      }
    }
    if (typeof localStorage !== 'undefined') {
      return {
        get: (key) => localStorage.getItem(key),
        set: (key, value) => localStorage.setItem(key, value),
        remove: (key) => localStorage.removeItem(key)
      }
    }
    return null
  }
  
  const loadData = () => {
    if (cachedData) return { ...cachedData }
    
    try {
      const storage = getStorage()
      if (storage) {
        const content = storage.get(STORAGE_KEY)
        if (content) {
          cachedData = JSON.parse(content)
          return { ...cachedData }
        }
      }
    } catch (e) {
      console.warn('Failed to load shared data:', e)
    }
    
    cachedData = JSON.parse(JSON.stringify(defaultData))
    saveData(cachedData)
    return { ...cachedData }
  }
  
  const saveData = (data) => {
    try {
      const storage = getStorage()
      if (storage) {
        storage.set(STORAGE_KEY, JSON.stringify(data))
      }
      cachedData = data
    } catch (e) {
      console.warn('Failed to save shared data:', e)
    }
  }
  
  const getStatusByTime = (startTime, endTime) => {
    const now = new Date()
    const start = new Date(startTime.replace(/-/g, '/'))
    const end = new Date(endTime.replace(/-/g, '/'))
    
    if (now < start) return 0
    if (now >= start && now <= end) return 1
    return 2
  }
  
  const isCouponActive = (coupon) => {
    if (coupon.type !== 2 || coupon.status !== 1) {
      return false
    }
    
    const now = new Date()
    const startTime = new Date(coupon.startTime.replace(/-/g, '/'))
    const endTime = new Date(coupon.endTime.replace(/-/g, '/'))
    
    return now >= startTime && now <= endTime
  }
  
  const sanitizeHtmlForApi = (html) => {
    if (!html || typeof html !== 'string') {
      return ''
    }
    return html
  }
  
  const SharedDataBridge = {
    loadData,
    saveData,
    getStatusByTime,
    isCouponActive,
    sanitizeHtmlForApi,
    
    getCouponList: (params = {}) => {
      const data = loadData()
      let filteredList = [...data.coupons]
      
      if (params.name) {
        filteredList = filteredList.filter(item => 
          item.name.includes(params.name)
        )
      }
      
      if (params.status !== undefined && params.status !== '') {
        filteredList = filteredList.filter(item => 
          item.status === Number(params.status)
        )
      }
      
      if (params.projectIds && params.projectIds.length > 0) {
        const projectIds = params.projectIds.map(Number)
        filteredList = filteredList.filter(item => 
          projectIds.includes(item.projectId)
        )
      }
      
      const page = params.page || 1
      const pageSize = params.pageSize || 10
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      
      const list = filteredList.slice(startIndex, endIndex)
      
      return {
        code: 200,
        data: {
          list,
          total: filteredList.length,
          page,
          pageSize
        },
        message: 'success'
      }
    },
    
    getCouponDetail: (id) => {
      const data = loadData()
      const coupon = data.coupons.find(item => item.id === Number(id))
      if (coupon) {
        return {
          code: 200,
          data: coupon,
          message: 'success'
        }
      }
      return {
        code: 404,
        message: '卡券不存在'
      }
    },
    
    createCoupon: (input) => {
      const data = loadData()
      const newCoupon = {
        id: data.nextCouponId++,
        ...input,
        usedQuantity: 0,
        createTime: new Date().toLocaleString('zh-CN', { hour12: false })
      }
      data.coupons.unshift(newCoupon)
      saveData(data)
      return {
        code: 200,
        data: { id: newCoupon.id },
        message: '创建成功'
      }
    },
    
    updateCoupon: (id, input) => {
      const data = loadData()
      const index = data.coupons.findIndex(item => item.id === Number(id))
      if (index !== -1) {
        data.coupons[index] = { ...data.coupons[index], ...input }
        saveData(data)
        return {
          code: 200,
          message: '更新成功'
        }
      }
      return {
        code: 404,
        message: '卡券不存在'
      }
    },
    
    deleteCoupon: (id) => {
      const data = loadData()
      const index = data.coupons.findIndex(item => item.id === Number(id))
      if (index !== -1) {
        data.coupons.splice(index, 1)
        saveData(data)
        return {
          code: 200,
          message: '删除成功'
        }
      }
      return {
        code: 404,
        message: '卡券不存在'
      }
    },
    
    updateCouponStatus: (id, status) => {
      const data = loadData()
      const index = data.coupons.findIndex(item => item.id === Number(id))
      if (index !== -1) {
        data.coupons[index].status = status
        saveData(data)
        return {
          code: 200,
          message: status === 1 ? '上架成功' : '下架成功'
        }
      }
      return {
        code: 404,
        message: '卡券不存在'
      }
    },
    
    updateCouponWeight: (id, weight) => {
      const data = loadData()
      const index = data.coupons.findIndex(item => item.id === Number(id))
      if (index !== -1) {
        data.coupons[index].weight = weight
        saveData(data)
        return {
          code: 200,
          message: '权重更新成功'
        }
      }
      return {
        code: 404,
        message: '卡券不存在'
      }
    },
    
    getDiscountCouponList: () => {
      const data = loadData()
      const discountCoupons = data.coupons.filter(item => isCouponActive(item))
      return {
        code: 200,
        data: {
          list: discountCoupons
        },
        message: 'success'
      }
    },
    
    getFlashSaleList: (params = {}) => {
      const data = loadData()
      let filteredList = data.flashSales.map(item => ({
        ...item,
        status: getStatusByTime(item.startTime, item.endTime)
      }))
      
      if (params.title) {
        filteredList = filteredList.filter(item => 
          item.title.includes(params.title)
        )
      }
      
      if (params.status !== undefined && params.status !== '') {
        filteredList = filteredList.filter(item => 
          item.status === Number(params.status)
        )
      }
      
      if (params.projectIds && params.projectIds.length > 0) {
        const projectIds = params.projectIds.map(Number)
        filteredList = filteredList.filter(item => 
          projectIds.includes(item.projectId)
        )
      }
      
      const page = params.page || 1
      const pageSize = params.pageSize || 10
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      
      const list = filteredList.slice(startIndex, endIndex)
      
      return {
        code: 200,
        data: {
          list,
          total: filteredList.length,
          page,
          pageSize
        },
        message: 'success'
      }
    },
    
    getFlashSaleDetail: (id) => {
      const data = loadData()
      const flashSale = data.flashSales.find(item => item.id === Number(id))
      if (flashSale) {
        return {
          code: 200,
          data: {
            ...flashSale,
            status: getStatusByTime(flashSale.startTime, flashSale.endTime)
          },
          message: 'success'
        }
      }
      return {
        code: 404,
        message: '秒杀活动不存在'
      }
    },
    
    createFlashSale: (input) => {
      const data = loadData()
      const sanitizedData = {
        ...input,
        content: sanitizeHtmlForApi(input.content)
      }
      
      const newFlashSale = {
        id: data.nextFlashSaleId++,
        ...sanitizedData,
        createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
        seckillConfig: input.seckillConfig || {
          originalAmount: 100,
          seckillAmount: 9.9,
          stock: 100,
          soldCount: 0,
          limitPerUser: 1,
          expireDate: '2026-12-31'
        }
      }
      data.flashSales.unshift(newFlashSale)
      saveData(data)
      return {
        code: 200,
        data: { id: newFlashSale.id },
        message: '创建成功'
      }
    },
    
    updateFlashSale: (id, input) => {
      const data = loadData()
      const index = data.flashSales.findIndex(item => item.id === Number(id))
      if (index !== -1) {
        const sanitizedData = {
          ...input,
          content: input.content !== undefined ? sanitizeHtmlForApi(input.content) : data.flashSales[index].content
        }
        
        data.flashSales[index] = { ...data.flashSales[index], ...sanitizedData }
        saveData(data)
        return {
          code: 200,
          message: '更新成功'
        }
      }
      return {
        code: 404,
        message: '秒杀活动不存在'
      }
    },
    
    deleteFlashSale: (id) => {
      const data = loadData()
      const index = data.flashSales.findIndex(item => item.id === Number(id))
      if (index !== -1) {
        data.flashSales.splice(index, 1)
        saveData(data)
        return {
          code: 200,
          message: '删除成功'
        }
      }
      return {
        code: 404,
        message: '秒杀活动不存在'
      }
    },
    
    updateFlashSaleSoldCount: (id, soldCount) => {
      const data = loadData()
      const index = data.flashSales.findIndex(item => item.id === Number(id))
      if (index !== -1) {
        if (!data.flashSales[index].seckillConfig) {
          data.flashSales[index].seckillConfig = {}
        }
        data.flashSales[index].seckillConfig.soldCount = soldCount
        saveData(data)
        return {
          code: 200,
          message: '库存更新成功'
        }
      }
      return {
        code: 404,
        message: '秒杀活动不存在'
      }
    },
    
    resetData: () => {
      cachedData = JSON.parse(JSON.stringify(defaultData))
      saveData(cachedData)
    }
  }
  
  return SharedDataBridge
}))
