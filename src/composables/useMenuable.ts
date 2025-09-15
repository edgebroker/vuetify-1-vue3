import { ref, reactive, computed, watch, onBeforeMount, onBeforeUnmount } from 'vue'

export const menuableProps = {
  activator: {
    default: null,
    validator: val => ['string', 'object'].includes(typeof val),
  },
  allowOverflow: Boolean,
  inputActivator: Boolean,
  light: Boolean,
  dark: Boolean,
  maxWidth: {
    type: [Number, String],
    default: 'auto',
  },
  minWidth: [Number, String],
  nudgeBottom: {
    type: [Number, String],
    default: 0,
  },
  nudgeLeft: {
    type: [Number, String],
    default: 0,
  },
  nudgeRight: {
    type: [Number, String],
    default: 0,
  },
  nudgeTop: {
    type: [Number, String],
    default: 0,
  },
  nudgeWidth: {
    type: [Number, String],
    default: 0,
  },
  offsetOverflow: Boolean,
  positionX: {
    type: Number,
    default: null,
  },
  positionY: {
    type: Number,
    default: null,
  },
  zIndex: {
    type: [Number, String],
    default: null,
  },
}

export default function useMenuable (props, {
  activator: activatorRef,
  content: contentRef,
  isActive,
} = {}) {
  const absoluteX = ref(0)
  const absoluteY = ref(0)
  const activatorFixed = ref(false)
  const hasWindow = ref(false)
  const pageWidth = ref(0)
  const pageYOffset = ref(0)
  const isContentActive = ref(false)
  const dimensions = reactive({
    activator: {
      top: 0, left: 0,
      bottom: 0, right: 0,
      width: 0, height: 0,
      offsetTop: 0, offsetLeft: 0,
      scrollHeight: 0,
    },
    content: {
      top: 0, left: 0,
      bottom: 0, right: 0,
      width: 0, height: 0,
      offsetTop: 0, offsetLeft: 0,
      scrollHeight: 0,
    },
  })

  const zIndex = computed(() => props.zIndex)
  const isAttached = computed(() => props.attach !== false)
  const hasActivator = computed(() => {
    return !!(activatorRef && activatorRef.value) || !!props.activator || props.inputActivator
  })

  const computedLeft = computed(() => {
    const a = dimensions.activator
    const c = dimensions.content
    const activatorLeft = (isAttached.value ? a.offsetLeft : a.left) || 0
    const minWidth = Math.max(a.width, c.width)
    let left = 0
    left += props.left ? activatorLeft - (minWidth - a.width) : activatorLeft
    if (props.offsetX) {
      const maxWidth = isNaN(props.maxWidth)
        ? a.width
        : Math.min(a.width, props.maxWidth)
      left += props.left ? -maxWidth : a.width
    }
    if (props.nudgeLeft) left -= parseInt(props.nudgeLeft)
    if (props.nudgeRight) left += parseInt(props.nudgeRight)
    return left
  })

  const computedTop = computed(() => {
    const a = dimensions.activator
    const c = dimensions.content
    let top = 0
    if (props.top) top += a.height - c.height
    if (isAttached.value) top += a.offsetTop
    else top += a.top + pageYOffset.value
    if (props.offsetY) top += props.top ? -a.height : a.height
    if (props.nudgeTop) top -= parseInt(props.nudgeTop)
    if (props.nudgeBottom) top += parseInt(props.nudgeBottom)
    return top
  })

  function callActivate () {
    if (!hasWindow.value) return
    activate()
  }

  function callDeactivate () {
    isContentActive.value = false
    deactivate()
  }

  function activate () {}
  function deactivate () {}

  watch(() => props.disabled, val => { val && callDeactivate() })

  if (isActive) {
    watch(isActive, val => {
      if (props.disabled) return
      val ? callActivate() : callDeactivate()
    })
  }

  watch(() => props.positionX, updateDimensions)
  watch(() => props.positionY, updateDimensions)

  onBeforeMount(checkForWindow)
  onBeforeUnmount(removeListeners)

  function checkForWindow () {
    if (!hasWindow.value) hasWindow.value = typeof window !== 'undefined'
  }

  function checkForPageYOffset () {
    if (hasWindow.value) {
      pageYOffset.value = activatorFixed.value ? 0 : getOffsetTop()
    }
  }

  function checkActivatorFixed () {
    if (props.attach !== false || !hasWindow.value) return
    let el = getActivator()
    while (el) {
      if (window.getComputedStyle(el).position === 'fixed') {
        activatorFixed.value = true
        return
      }
      el = el.offsetParent
    }
    activatorFixed.value = false
  }

  function getActivator () {
    if (props.activator) {
      return typeof props.activator === 'string'
        ? document.querySelector(props.activator)
        : props.activator
    }
    return activatorRef && activatorRef.value ? activatorRef.value : null
  }

  function absolutePosition () {
    return {
      offsetTop: 0,
      offsetLeft: 0,
      scrollHeight: 0,
      top: props.positionY != null ? props.positionY : absoluteY.value,
      bottom: props.positionY != null ? props.positionY : absoluteY.value,
      left: props.positionX != null ? props.positionX : absoluteX.value,
      right: props.positionX != null ? props.positionX : absoluteX.value,
      height: 0,
      width: 0,
    }
  }

  function getInnerHeight () {
    if (!hasWindow.value) return 0
    return window.innerHeight || document.documentElement.clientHeight
  }

  function getOffsetLeft () {
    if (!hasWindow.value) return 0
    return window.pageXOffset || document.documentElement.scrollLeft
  }

  function getOffsetTop () {
    if (!hasWindow.value) return 0
    return window.pageYOffset || document.documentElement.scrollTop
  }

  function getRoundedBoundedClientRect (el) {
    const rect = el.getBoundingClientRect()
    return {
      top: Math.round(rect.top),
      left: Math.round(rect.left),
      bottom: Math.round(rect.bottom),
      right: Math.round(rect.right),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    }
  }

  function measure (el) {
    if (!el || !hasWindow.value) return null
    const rect = getRoundedBoundedClientRect(el)
    if (isAttached.value) {
      const style = window.getComputedStyle(el)
      rect.left = parseInt(style.marginLeft)
      rect.top = parseInt(style.marginTop)
    }
    return rect
  }

  function isShown (el) {
    return el.style.display !== 'none'
  }

  function sneakPeek (cb) {
    requestAnimationFrame(() => {
      const el = contentRef && contentRef.value
      if (!el || isShown(el)) return cb()
      el.style.display = 'inline-block'
      cb()
      el.style.display = 'none'
    })
  }

  function updateDimensions () {
    checkForWindow()
    checkActivatorFixed()
    checkForPageYOffset()
    pageWidth.value = document.documentElement.clientWidth
    const dims = {}
    if (!hasActivator.value || props.absolute) {
      dims.activator = absolutePosition()
    } else {
      const activator = getActivator()
      dims.activator = measure(activator) || {}
      dims.activator.offsetLeft = activator ? activator.offsetLeft : 0
      dims.activator.offsetTop = isAttached.value && activator ? activator.offsetTop : 0
    }
    sneakPeek(() => {
      dims.content = measure(contentRef && contentRef.value) || {}
      Object.assign(dimensions.activator, dims.activator)
      Object.assign(dimensions.content, dims.content)
    })
  }

  function onResizeScroll () {
    if (isActive && isActive.value) updateDimensions()
  }

  function addListeners () {
    if (!hasWindow.value) return
    window.addEventListener('resize', onResizeScroll)
    window.addEventListener('scroll', onResizeScroll)
  }

  function removeListeners () {
    if (!hasWindow.value) return
    window.removeEventListener('resize', onResizeScroll)
    window.removeEventListener('scroll', onResizeScroll)
  }

  if (isActive) {
    watch(isActive, val => {
      val ? addListeners() : removeListeners()
    }, { immediate: true })
  }

  function calcLeft (menuWidth) {
    const left = isAttached.value
      ? computedLeft.value
      : calcXOverflow(computedLeft.value, menuWidth)
    return `${left}px`
  }

  function calcTop () {
    const top = isAttached.value
      ? computedTop.value
      : calcYOverflow(computedTop.value)
    return `${top}px`
  }

  function calcXOverflow (left, menuWidth) {
    const xOverflow = left + menuWidth - pageWidth.value + 12
    if ((!props.left || props.right) && xOverflow > 0) {
      left = Math.max(left - xOverflow, 0)
    } else {
      left = Math.max(left, 12)
    }
    return left + getOffsetLeft()
  }

  function calcYOverflow (top) {
    const documentHeight = getInnerHeight()
    const toTop = pageYOffset.value + documentHeight
    const activator = dimensions.activator
    const contentHeight = dimensions.content.height
    const totalHeight = top + contentHeight
    const isOverflowing = toTop < totalHeight
    if (isOverflowing && props.offsetOverflow && activator.top > contentHeight) {
      top = pageYOffset.value + (activator.top - contentHeight)
    } else if (isOverflowing && !props.allowOverflow) {
      top = toTop - contentHeight - 12
    } else if (top < pageYOffset.value && !props.allowOverflow) {
      top = pageYOffset.value + 12
    }
    return top < 12 ? 12 : top
  }

  return {
    activatorFixed,
    absoluteX,
    absoluteY,
    dimensions,
    isContentActive,
    pageWidth,
    pageYOffset,
    computedLeft,
    computedTop,
    updateDimensions,
    callActivate,
    callDeactivate,
    calcLeft,
    calcTop,
    calcXOverflow,
    calcYOverflow,
    zIndex,
  }
}

