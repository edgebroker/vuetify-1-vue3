import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

export default function useMenuActivator (props, {
  activatorRef,
  contentRef,
  isActive,
  runDelay,
  menuable,
  getActivator
}) {
  const hasJustFocused = ref(false)
  const currentActivator = ref(null)

  function activatorClickHandler (e) {
    if (props.openOnClick && !isActive.value) {
      const activator = getActivator(e)
      activator && activator.focus && activator.focus()
      isActive.value = true
      menuable.absoluteX.value = e.clientX
      menuable.absoluteY.value = e.clientY
    } else if (props.closeOnClick && isActive.value) {
      const activator = getActivator(e)
      activator && activator.blur && activator.blur()
      isActive.value = false
    }
  }

  function mouseEnterHandler () {
    runDelay('open', () => {
      if (hasJustFocused.value) return

      hasJustFocused.value = true
      isActive.value = true
    })
  }

  function mouseLeaveHandler (e) {
    runDelay('close', () => {
      const content = contentRef.value
      if (content && e && content.contains(e.relatedTarget)) return

      requestAnimationFrame(() => {
        isActive.value = false
        menuable.callDeactivate()
      })
    })
  }

  function addActivatorEvents (activator = null) {
    if (!activator || props.disabled) return

    activator.addEventListener('click', activatorClickHandler)
  }

  function removeActivatorEvents (activator = null) {
    if (!activator) return

    activator.removeEventListener('click', activatorClickHandler)
  }

  function updateActivator () {
    nextTick(() => {
      const activator = getActivator()
      if (activator === currentActivator.value) return

      removeActivatorEvents(currentActivator.value)
      currentActivator.value = activator
      if (!props.disabled) addActivatorEvents(currentActivator.value)
    })
  }

  watch(() => props.disabled, val => {
    if (val) removeActivatorEvents(currentActivator.value)
    else addActivatorEvents(currentActivator.value)
  })

  watch(menuable.isContentActive, val => {
    hasJustFocused.value = val
  })

  if (activatorRef) watch(activatorRef, updateActivator)
  watch(() => props.activator, updateActivator)

  onMounted(() => {
    updateActivator()
  })

  onBeforeUnmount(() => {
    removeActivatorEvents(currentActivator.value)
  })

  return {
    hasJustFocused,
    activatorClickHandler,
    mouseEnterHandler,
    mouseLeaveHandler,
    addActivatorEvents,
    removeActivatorEvents,
    updateActivator
  }
}
