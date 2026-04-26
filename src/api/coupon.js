const mockCoupons = [
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
    contentImages: [
      'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg',
      'https://fuss10.elemecdn.com/2/11/6535bcfb26e4c79b48ddde44f476fpeg.png'
    ],
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
]

let coupons = [...mockCoupons]
let nextId = 5

export const getCouponList = (params) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let filteredList = [...coupons]
      
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

export const getCouponDetail = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const coupon = coupons.find(item => item.id === Number(id))
      if (coupon) {
        resolve({
          code: 200,
          data: coupon,
          message: 'success'
        })
      } else {
        reject({
          code: 404,
          message: '卡券不存在'
        })
      }
    }, 300)
  })
}

export const createCoupon = (data) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newCoupon = {
        id: nextId++,
        ...data,
        usedQuantity: 0,
        createTime: new Date().toLocaleString('zh-CN', { hour12: false })
      }
      coupons.unshift(newCoupon)
      resolve({
        code: 200,
        data: { id: newCoupon.id },
        message: '创建成功'
      })
    }, 500)
  })
}

export const updateCoupon = (id, data) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = coupons.findIndex(item => item.id === Number(id))
      if (index !== -1) {
        coupons[index] = { ...coupons[index], ...data }
        resolve({
          code: 200,
          message: '更新成功'
        })
      } else {
        reject({
          code: 404,
          message: '卡券不存在'
        })
      }
    }, 500)
  })
}

export const deleteCoupon = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = coupons.findIndex(item => item.id === Number(id))
      if (index !== -1) {
        coupons.splice(index, 1)
        resolve({
          code: 200,
          message: '删除成功'
        })
      } else {
        reject({
          code: 404,
          message: '卡券不存在'
        })
      }
    }, 300)
  })
}

export const updateCouponStatus = (id, status) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = coupons.findIndex(item => item.id === Number(id))
      if (index !== -1) {
        coupons[index].status = status
        resolve({
          code: 200,
          message: status === 1 ? '上架成功' : '下架成功'
        })
      } else {
        reject({
          code: 404,
          message: '卡券不存在'
        })
      }
    }, 300)
  })
}

export const updateCouponWeight = (id, weight) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = coupons.findIndex(item => item.id === Number(id))
      if (index !== -1) {
        coupons[index].weight = weight
        resolve({
          code: 200,
          message: '权重更新成功'
        })
      } else {
        reject({
          code: 404,
          message: '卡券不存在'
        })
      }
    }, 300)
  })
}

export const uploadImage = (file) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockUrls = [
        'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg',
        'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        'https://fuss10.elemecdn.com/2/11/6535bcfb26e4c79b48ddde44f476fpeg.png'
      ]
      const randomUrl = mockUrls[Math.floor(Math.random() * mockUrls.length)]
      resolve({
        code: 200,
        data: {
          url: randomUrl
        },
        message: '上传成功'
      })
    }, 1000)
  })
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

export const getDiscountCouponList = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const discountCoupons = coupons.filter(item => isCouponActive(item))
      resolve({
        code: 200,
        data: {
          list: discountCoupons
        },
        message: 'success'
      })
    }, 300)
  })
}
