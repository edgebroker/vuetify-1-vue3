import { getCurrentInstance, watch } from 'vue'

export default function useTabsWatchers (propsRefs, attrs, { activeTab, hasArrows }) {
  const vm = getCurrentInstance()
  const proxy = vm?.proxy

  watch(activeTab, (val, oldVal) => {
    if (!proxy) return

    proxy.setOverflow && proxy.setOverflow()

    if (!val) return

    if (proxy.tabItems) {
      const items = proxy.items || []
      const index = items.indexOf(val)
      const getValue = typeof proxy.getValue === 'function' ? proxy.getValue.bind(proxy) : undefined
      if (getValue) {
        proxy.tabItems(getValue(val, index))
      } else {
        proxy.tabItems(val)
      }
    }

    if (oldVal == null) return

    proxy.updateTabsView && proxy.updateTabsView()
  })

  propsRefs?.alignWithTitle && watch(propsRefs.alignWithTitle, () => {
    proxy?.callSlider && proxy.callSlider()
  })

  propsRefs?.centered && watch(propsRefs.centered, () => {
    proxy?.callSlider && proxy.callSlider()
  })

  propsRefs?.fixedTabs && watch(propsRefs.fixedTabs, () => {
    proxy?.callSlider && proxy.callSlider()
  })

  watch(hasArrows, (val) => {
    if (!proxy) return
    if (!val) proxy.scrollOffset = 0
  })

  watch(() => proxy?.internalValue, (val) => {
    const handler = attrs?.onInput
    if (!handler) return

    if (Array.isArray(handler)) {
      handler.forEach(fn => typeof fn === 'function' && fn(val))
    } else if (typeof handler === 'function') {
      handler(val)
    }
  })

  watch(() => proxy?.internalLazyValue, () => {
    const handler = proxy?.updateTabs || proxy?.updateItemsState
    if (typeof handler === 'function') {
      handler.call(proxy)
    }
  })

  propsRefs?.right && watch(propsRefs.right, () => {
    proxy?.callSlider && proxy.callSlider()
  })

  watch(() => proxy?.$vuetify?.application?.left, () => {
    proxy?.onResize && proxy.onResize()
  })

  watch(() => proxy?.$vuetify?.application?.right, () => {
    proxy?.onResize && proxy.onResize()
  })

  watch(() => proxy?.scrollOffset, (val) => {
    const container = proxy?.$refs?.container
    if (container && container.style) {
      container.style.transform = `translateX(${-val}px)`
    }

    if (hasArrows.value) {
      proxy && typeof proxy.checkPrevIcon === 'function' && (proxy.prevIconVisible = proxy.checkPrevIcon())
      proxy && typeof proxy.checkNextIcon === 'function' && (proxy.nextIconVisible = proxy.checkNextIcon())
    }
  })
}
