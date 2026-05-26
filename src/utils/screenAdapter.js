const BASE_WIDTH = 1920
const BASE_HEIGHT = 1080

export function useScreenAdapter(containerRef) {
  let scale = 1
  let offsetX = 0
  let offsetY = 0

  const calcScale = () => {
    const currentWidth = window.innerWidth
    const currentHeight = window.innerHeight
    const widthScale = currentWidth / BASE_WIDTH
    const heightScale = currentHeight / BASE_HEIGHT
    scale = Math.min(widthScale, heightScale)
    offsetX = (currentWidth - BASE_WIDTH * scale) / 2
    offsetY = (currentHeight - BASE_HEIGHT * scale) / 2
    return { scale, offsetX, offsetY }
  }

  const applyScale = () => {
    if (!containerRef.value) return
    const { scale: s, offsetX: x, offsetY: y } = calcScale()
    containerRef.value.style.transform = `translate(${x}px, ${y}px) scale(${s})`
    containerRef.value.style.transformOrigin = 'top left'
    containerRef.value.style.width = `${BASE_WIDTH}px`
    containerRef.value.style.height = `${BASE_HEIGHT}px`
  }

  let debounceTimer = null
  const debouncedApply = () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(applyScale, 100)
  }

  const initAdapter = () => {
    applyScale()
    window.addEventListener('resize', debouncedApply)
  }

  const destroyAdapter = () => {
    window.removeEventListener('resize', debouncedApply)
    if (debounceTimer) clearTimeout(debounceTimer)
  }

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  }

  return {
    initAdapter,
    destroyAdapter,
    applyScale,
    toggleFullscreen,
    BASE_WIDTH,
    BASE_HEIGHT
  }
}
