import { computed, getCurrentInstance } from 'vue'

export default function useTabsComputed (props) {
  const vm = getCurrentInstance()
  const proxy = vm?.proxy

  const activeTab = computed(() => {
    const selected = proxy?.selectedItems || []
    if (!selected.length) return undefined

    return selected[0]
  })

  const containerStyles = computed(() => {
    if (!props.height) return null

    return {
      height: `${parseInt(props.height, 10)}px`
    }
  })

  const isMobile = computed(() => {
    const breakpoint = proxy?.$vuetify?.breakpoint
    if (!breakpoint) return false

    const parsed = parseInt(props.mobileBreakPoint, 10)
    const mobileBreakPoint = isNaN(parsed) ? 1264 : parsed

    return breakpoint.width < mobileBreakPoint
  })

  const hasArrows = computed(() => {
    if (!proxy) return false

    return ((props.showArrows || !isMobile.value) && proxy.isOverflowing) || false
  })

  const sliderStyles = computed(() => {
    const left = proxy?.sliderLeft
    const width = proxy?.sliderWidth

    return {
      left: `${left != null ? left : 0}px`,
      transition: left != null ? null : 'none',
      width: `${width != null ? width : 0}px`
    }
  })

  return {
    activeTab,
    containerStyles,
    hasArrows,
    isMobile,
    sliderStyles
  }
}
