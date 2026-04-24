import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getCouponList,
  getCouponDetail,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  updateCouponStatus,
  updateCouponWeight
} from '@/api/coupon'

export const useCouponStore = defineStore('coupon', () => {
  const couponList = ref([])
  const currentCoupon = ref(null)
  const total = ref(0)
  const loading = ref(false)

  const statusMap = {
    0: { label: '下架', value: 0, type: 'info' },
    1: { label: '上架', value: 1, type: 'success' }
  }

  const typeMap = {
    1: { label: '满减券', value: 1 },
    2: { label: '折扣券', value: 2 }
  }

  const getStatusInfo = (status) => statusMap[status] || statusMap[0]
  const getTypeInfo = (type) => typeMap[type] || typeMap[1]

  const fetchCouponList = async (params = {}) => {
    loading.value = true
    try {
      const res = await getCouponList({
        page: 1,
        pageSize: 10,
        ...params
      })
      couponList.value = res.data.list
      total.value = res.data.total
    } finally {
      loading.value = false
    }
  }

  const fetchCouponDetail = async (id) => {
    loading.value = true
    try {
      const res = await getCouponDetail(id)
      currentCoupon.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }

  const addCoupon = async (data) => {
    const res = await createCoupon(data)
    return res
  }

  const editCoupon = async (id, data) => {
    const res = await updateCoupon(id, data)
    return res
  }

  const removeCoupon = async (id) => {
    const res = await deleteCoupon(id)
    return res
  }

  const toggleStatus = async (id, status) => {
    const res = await updateCouponStatus(id, status)
    const item = couponList.value.find(item => item.id === id)
    if (item) {
      item.status = status
    }
    return res
  }

  const changeWeight = async (id, weight) => {
    const res = await updateCouponWeight(id, weight)
    const item = couponList.value.find(item => item.id === id)
    if (item) {
      item.weight = weight
    }
    return res
  }

  return {
    couponList,
    currentCoupon,
    total,
    loading,
    statusMap,
    typeMap,
    getStatusInfo,
    getTypeInfo,
    fetchCouponList,
    fetchCouponDetail,
    addCoupon,
    editCoupon,
    removeCoupon,
    toggleStatus,
    changeWeight
  }
})
