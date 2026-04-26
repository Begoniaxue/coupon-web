import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getFlashSaleList,
  getFlashSaleDetail,
  createFlashSale,
  updateFlashSale,
  deleteFlashSale
} from '@/api/flashSale'

export const useFlashSaleStore = defineStore('flashSale', () => {
  const flashSaleList = ref([])
  const currentFlashSale = ref(null)
  const total = ref(0)
  const loading = ref(false)

  const statusMap = {
    0: { label: '未开始', value: 0, type: 'info' },
    1: { label: '进行中', value: 1, type: 'success' },
    2: { label: '已结束', value: 2, type: 'warning' }
  }

  const getStatusInfo = (status) => statusMap[status] || statusMap[0]

  const fetchFlashSaleList = async (params = {}) => {
    loading.value = true
    try {
      const res = await getFlashSaleList({
        page: 1,
        pageSize: 10,
        ...params
      })
      flashSaleList.value = res.data.list
      total.value = res.data.total
    } finally {
      loading.value = false
    }
  }

  const fetchFlashSaleDetail = async (id) => {
    loading.value = true
    try {
      const res = await getFlashSaleDetail(id)
      currentFlashSale.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }

  const addFlashSale = async (data) => {
    const res = await createFlashSale(data)
    return res
  }

  const editFlashSale = async (id, data) => {
    const res = await updateFlashSale(id, data)
    return res
  }

  const removeFlashSale = async (id) => {
    const res = await deleteFlashSale(id)
    return res
  }

  return {
    flashSaleList,
    currentFlashSale,
    total,
    loading,
    statusMap,
    getStatusInfo,
    fetchFlashSaleList,
    fetchFlashSaleDetail,
    addFlashSale,
    editFlashSale,
    removeFlashSale
  }
})

