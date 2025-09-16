import { getCurrentInstance } from 'vue'

export default function useTabsTouch () {
  const vm = getCurrentInstance()
  const proxy = vm?.proxy

  function newOffset (direction) {
    const wrapper = proxy?.$refs?.wrapper
    const container = proxy?.$refs?.container

    if (!wrapper || !container) return 0

    const clientWidth = wrapper.clientWidth

    if (direction === 'prev') {
      return Math.max((proxy?.scrollOffset || 0) - clientWidth, 0)
    }

    return Math.min((proxy?.scrollOffset || 0) + clientWidth, container.clientWidth - clientWidth)
  }

  function onTouchStart (e) {
    const container = proxy?.$refs?.container
    if (!container) return

    proxy.startX = (proxy.scrollOffset || 0) + e.touchstartX
    container.style.transition = 'none'
    container.style.willChange = 'transform'
  }

  function onTouchMove (e) {
    proxy.scrollOffset = proxy.startX - e.touchmoveX
  }

  function onTouchEnd () {
    const container = proxy?.$refs?.container
    const wrapper = proxy?.$refs?.wrapper

    if (!container || !wrapper) return

    const maxScrollOffset = container.clientWidth - wrapper.clientWidth
    container.style.transition = null
    container.style.willChange = null

    if (proxy.scrollOffset < 0 || !proxy.isOverflowing) {
      proxy.scrollOffset = 0
    } else if (proxy.scrollOffset >= maxScrollOffset) {
      proxy.scrollOffset = maxScrollOffset
    }
  }

  return {
    newOffset,
    onTouchEnd,
    onTouchMove,
    onTouchStart
  }
}
