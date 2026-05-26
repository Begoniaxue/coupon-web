import { ref, onUnmounted } from 'vue'

export function useDataPolling(fetchFn, interval = 5000, options = {}) {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const isPolling = ref(false)
  let timer = null

  const { immediate = true, onSuccess, onError } = options

  const fetchData = async () => {
    loading.value = true
    error.value = null
    try {
      const result = await fetchFn()
      data.value = result
      onSuccess?.(result)
      return result
    } catch (e) {
      error.value = e
      onError?.(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  const start = () => {
    if (isPolling.value) return
    isPolling.value = true
    if (immediate) fetchData()
    timer = setInterval(fetchData, interval)
  }

  const stop = () => {
    isPolling.value = false
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  const restart = (newInterval) => {
    stop()
    if (newInterval) interval = newInterval
    start()
  }

  onUnmounted(() => stop())

  return { data, loading, error, isPolling, fetchData, start, stop, restart }
}

export function useWebSocketMock(onMessage) {
  const isConnected = ref(false)
  let ws = null

  const connect = () => {
    ws = {
      readyState: 1,
      close: () => {
        isConnected.value = false
      }
    }
    isConnected.value = true

    const intervalId = setInterval(() => {
      if (isConnected.value && onMessage) {
        onMessage({
          timestamp: Date.now(),
          realtimeOrders: Math.floor(Math.random() * 100),
          realtimeRevenue: Math.floor(Math.random() * 50000),
          activeUsers: Math.floor(Math.random() * 10000)
        })
      }
    }, 3000)

    ws._intervalId = intervalId
  }

  const disconnect = () => {
    if (ws && ws._intervalId) {
      clearInterval(ws._intervalId)
    }
    if (ws) ws.close()
    isConnected.value = false
  }

  onUnmounted(() => disconnect())

  return { isConnected, connect, disconnect }
}
