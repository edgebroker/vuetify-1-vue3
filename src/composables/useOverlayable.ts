import { ref, watch, onBeforeUnmount, getCurrentInstance } from 'vue'
import { keyCodes, addPassiveEventListener } from '../util/helpers'

export const overlayableProps = {
  hideOverlay: Boolean
}

export default function useOverlayable (props, {
  absolute,
  activeZIndex,
  content: contentRef,
  dialog: dialogRef,
  isActive
} = {}) {
  const overlay = ref(null)
  let overlayTimeout
  const overlayTransitionDuration = 500 + 150 // transition + delay
  const vm = getCurrentInstance()

  function showScroll () {
    document.documentElement.classList.remove('overflow-y-hidden')
    window.removeEventListener('wheel', scrollListener)
    window.removeEventListener('keydown', scrollListener)
  }

  function hideScroll () {
    if (vm && vm.proxy && vm.proxy.$vuetify.breakpoint.smAndDown) {
      document.documentElement.classList.add('overflow-y-hidden')
    } else {
      addPassiveEventListener(window, 'wheel', scrollListener, { passive: false })
      window.addEventListener('keydown', scrollListener)
    }
  }

  function genOverlay () {
    if ((!isActive || !isActive.value || props.hideOverlay) ||
      (isActive && isActive.value && overlayTimeout) ||
      overlay.value
    ) {
      clearTimeout(overlayTimeout)

      return overlay.value &&
        overlay.value.classList.add('v-overlay--active')
    }

    overlay.value = document.createElement('div')
    overlay.value.className = 'v-overlay'

    const abs = typeof absolute === 'object' ? absolute.value : absolute
    if (abs) overlay.value.className += ' v-overlay--absolute'

    hideScroll()

    const parent = abs
      ? vm && vm.proxy && vm.proxy.$el && vm.proxy.$el.parentNode
      : document.querySelector('[data-app]')

    parent && parent.insertBefore(overlay.value, parent.firstChild)

    if (overlay.value) void overlay.value.clientHeight // Force repaint
    requestAnimationFrame(() => {
      if (!overlay.value) return

      overlay.value.className += ' v-overlay--active'

      const z = typeof activeZIndex === 'object'
        ? activeZIndex && activeZIndex.value
        : activeZIndex
      if (z !== undefined) {
        overlay.value.style.zIndex = String(z - 1)
      }
    })

    return true
  }

  function removeOverlay (show = true) {
    if (!overlay.value) {
      return show && showScroll()
    }

    overlay.value.classList.remove('v-overlay--active')

    overlayTimeout = window.setTimeout(() => {
      try {
        if (overlay.value && overlay.value.parentNode) {
          overlay.value.parentNode.removeChild(overlay.value)
        }
        overlay.value = null
        show && showScroll()
      } catch (e) { console.log(e) }

      clearTimeout(overlayTimeout)
      overlayTimeout = undefined
    }, overlayTransitionDuration)
  }

  function hasScrollbar (el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false

    const style = window.getComputedStyle(el)
    return ['auto', 'scroll'].includes(style.overflowY) && el.scrollHeight > el.clientHeight
  }

  function shouldScroll (el, delta) {
    if (el.scrollTop === 0 && delta < 0) return true
    return el.scrollTop + el.clientHeight === el.scrollHeight && delta > 0
  }

  function isInside (el, parent) {
    if (el === parent) {
      return true
    } else if (el === null || el === document.body) {
      return false
    } else {
      return isInside(el.parentNode, parent)
    }
  }

  function composedPath (e) {
    if (e.composedPath) return e.composedPath()

    const path = []
    let el = e.target

    while (el) {
      path.push(el)

      if (el.tagName === 'HTML') {
        path.push(document)
        path.push(window)

        return path
      }

      el = el.parentElement
    }
    return path
  }

  function checkPath (e) {
    const path = e.path || composedPath(e)
    const delta = e.deltaY

    if (e.type === 'keydown' && path[0] === document.body) {
      const dialog = dialogRef && dialogRef.value
      const selected = window.getSelection().anchorNode
      if (dialog && hasScrollbar(dialog) && isInside(selected, dialog)) {
        return shouldScroll(dialog, delta)
      }
      return true
    }

    for (let index = 0; index < path.length; index++) {
      const el = path[index]

      if (el === document) return true
      if (el === document.documentElement) return true
      if (contentRef && el === contentRef.value) return true

      if (hasScrollbar(el)) return shouldScroll(el, delta)
    }

    return true
  }

  function scrollListener (e) {
    if (e.type === 'keydown') {
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) ||
        e.target.isContentEditable
      ) return

      const up = [keyCodes.up, keyCodes.pageup]
      const down = [keyCodes.down, keyCodes.pagedown]

      if (up.includes(e.keyCode)) {
        e.deltaY = -1
      } else if (down.includes(e.keyCode)) {
        e.deltaY = 1
      } else {
        return
      }
    }

    if (e.target === overlay.value ||
      (e.type !== 'keydown' && e.target === document.body) ||
      checkPath(e)
    ) e.preventDefault()
  }

  watch(() => props.hideOverlay, val => {
    if (val) removeOverlay()
    else genOverlay()
  })

  onBeforeUnmount(() => {
    removeOverlay()
  })

  return {
    overlay,
    genOverlay,
    removeOverlay,
    scrollListener,
    hasScrollbar,
    shouldScroll,
    isInside,
    checkPath,
    composedPath,
    hideScroll,
    showScroll
  }
}
