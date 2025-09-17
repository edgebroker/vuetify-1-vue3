import "@/css/vuetify.css"

import { defineComponent, h, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

// Composables
import useBootable from '../../composables/useBootable'
import useDelayable from '../../composables/useDelayable'
import useDetachable, { detachableProps } from '../../composables/useDetachable'
import useDependent from '../../composables/useDependent'
import useMenuable, { menuableProps } from '../../composables/useMenuable'
import useReturnable, { returnableProps } from '../../composables/useReturnable'
import useThemeable, { themeProps } from '../../composables/useThemeable'
import useToggleable from '../../composables/useToggleable'
import useMenuActivator from './composables/useMenuActivator'
import useMenuGenerators from './composables/useMenuGenerators'
import useMenuKeyable from './composables/useMenuKeyable'
import useMenuPosition from './composables/useMenuPosition'

// Directives
import ClickOutside from '../../directives/click-outside'
import Resize from '../../directives/resize'

// Helpers
import { convertToUnit } from '../../util/helpers'
import ThemeProvider from '../../util/ThemeProvider'

export default defineComponent({
  name: 'v-menu',

  directives: {
    ClickOutside,
    Resize
  },

  props: {
    auto: Boolean,
    closeOnClick: {
      type: Boolean,
      default: true
    },
    closeOnContentClick: {
      type: Boolean,
      default: true
    },
    disabled: Boolean,
    disableKeys: Boolean,
    fullWidth: Boolean,
    maxHeight: { default: 'auto' },
    openOnClick: {
      type: Boolean,
      default: true
    },
    offsetX: Boolean,
    offsetY: Boolean,
    openOnHover: Boolean,
    openDelay: {
      type: [Number, String],
      default: 0
    },
    closeDelay: {
      type: [Number, String],
      default: 0
    },
    origin: {
      type: String,
      default: 'top left'
    },
    transition: {
      type: [Boolean, String],
      default: 'v-menu-transition'
    },
    ...detachableProps,
    ...menuableProps,
    ...returnableProps,
    ...themeProps
  },

  setup (props, { slots, emit, attrs, expose }) {
    const activatorRef = ref(null)
    const activatorNode = ref(null)
    const contentRef = ref(null)
    const activatedBy = ref(null)
    const defaultOffset = 8
    let resizeTimeout = 0

    const { runDelay, clearDelay } = useDelayable(props)
    const { isActive } = useToggleable(props, emit)
    const menuable = useMenuable(props, { activator: activatorRef, content: contentRef, isActive })
    const detachable = useDetachable(props, { activator: activatorNode, content: contentRef, isActive })
    const { save } = useReturnable(props, { isActive, emit })
    const { themeClasses, rootThemeClasses } = useThemeable(props)
    const { showLazyContent } = useBootable(props, { isActive })
    const dependent = useDependent()
    const selectedIndex = ref(null)

    function getActivator (e) {
      if (props.activator) {
        if (typeof props.activator === 'string') {
          return typeof document !== 'undefined' ? document.querySelector(props.activator) : null
        }
        return props.activator
      }

      if (activatorRef.value) {
        return activatorRef.value.children.length > 0
          ? activatorRef.value.children[0]
          : activatorRef.value
      }

      if (e && e.currentTarget) {
        activatedBy.value = e.currentTarget
        return activatedBy.value
      }

      if (activatedBy.value) return activatedBy.value

      if (activatorNode.value) {
        const node = Array.isArray(activatorNode.value) ? activatorNode.value[0] : activatorNode.value
        const el = node && node.elm
        if (el) return el
      }

      return null
    }

    const menuActivator = useMenuActivator(props, {
      activatorRef,
      contentRef,
      isActive,
      runDelay,
      menuable,
      getActivator
    })

    const menuKeyable = useMenuKeyable(props, {
      contentRef,
      isActive,
      getActivator
    })

    const menuPosition = useMenuPosition(props, {
      contentRef,
      dimensions: menuable.dimensions,
      computedTop: menuable.computedTop,
      isAttached: menuable.isAttached,
      defaultOffset,
      tiles: menuKeyable.tiles,
      selectedIndex
    })

    const calculatedMaxHeight = computed(() => props.auto ? '200px' : convertToUnit(props.maxHeight))
    const calculatedMaxWidth = computed(() => convertToUnit(props.maxWidth))
    const calculatedMinWidth = computed(() => {
      if (props.minWidth !== undefined && props.minWidth !== null) {
        return convertToUnit(props.minWidth)
      }

      const activatorWidth = menuable.dimensions.activator.width || 0
      const parsedNudgeWidth = Number(props.nudgeWidth || 0)
      const nudgeWidth = isNaN(parsedNudgeWidth) ? 0 : parsedNudgeWidth
      const minWidth = activatorWidth + nudgeWidth + (props.auto ? 16 : 0)
      const parsedMaxWidth = parseInt(calculatedMaxWidth.value, 10)
      const width = isNaN(parsedMaxWidth) ? minWidth : Math.min(parsedMaxWidth, minWidth)

      return `${width}px`
    })

    const calculatedLeft = computed(() => {
      if (!props.auto) {
        return menuable.calcLeft(menuable.dimensions.content.width)
      }

      const left = menuPosition.calcLeftAuto()
      return `${menuable.calcXOverflow(left, menuable.dimensions.content.width)}px`
    })

    const calculatedTop = computed(() => {
      if (!props.auto || menuable.isAttached.value) {
        return menuable.calcTop()
      }

      return `${menuable.calcYOverflow(menuPosition.calculatedTopAuto.value)}px`
    })

    const styles = computed(() => ({
      maxHeight: calculatedMaxHeight.value,
      minWidth: calculatedMinWidth.value,
      maxWidth: calculatedMaxWidth.value,
      top: calculatedTop.value,
      left: calculatedLeft.value,
      transformOrigin: props.origin,
      zIndex: menuable.zIndex.value
    }))

    function closeConditional () {
      return isActive.value && props.closeOnClick
    }

    function activate () {
      menuKeyable.getTiles()
      menuable.updateDimensions()
      requestAnimationFrame(() => {
        menuable.isContentActive.value = true
        menuPosition.calculatedTopAuto.value = menuPosition.calcTopAuto()
        if (props.auto && contentRef.value) {
          contentRef.value.scrollTop = menuPosition.calcScrollPosition()
        }
      })
    }

    function deactivate () {
      menuable.callDeactivate()
    }

    function onResize () {
      if (!isActive.value) return

      if (contentRef.value) contentRef.value.offsetWidth
      menuable.updateDimensions()
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(menuable.updateDimensions, 100)
    }

    const menuGenerators = useMenuGenerators(props, {
      slots,
      attrs,
      activatorRef,
      activatorNode,
      contentRef,
      isActive,
      menuable,
      menuActivator,
      menuKeyable,
      showLazyContent,
      styles,
      rootThemeClasses,
      getScopeIdAttrs: detachable.getScopeIdAttrs,
      closeConditional,
      dependent
    })

    watch(isActive, val => {
      dependent.isActive.value = val
      if (val) activate()
      else deactivate()
    })

    onMounted(() => {
      if (isActive.value) activate()
    })

    onBeforeUnmount(() => {
      clearTimeout(resizeTimeout)
    })

    const exposed = {
      activatorRef,
      activatorNode,
      contentRef,
      runDelay,
      clearDelay,
      isActive,
      ...menuable,
      ...detachable,
      save,
      themeClasses,
      rootThemeClasses,
      hasJustFocused: menuActivator.hasJustFocused,
      showLazyContent,
      genActivator: menuGenerators.genActivator,
      genContent: menuGenerators.genContent,
      genTransition: menuGenerators.genTransition,
      onKeyDown: menuKeyable.onKeyDown,
      onResize,
      styles,
      calculatedLeft,
      calculatedTop,
      calculatedMinWidth,
      calculatedMaxWidth,
      calculatedMaxHeight,
      closeConditional,
      activate,
      deactivate
    }

    expose(exposed)

    return () => {
      const data = {
        staticClass: 'v-menu',
        class: { 'v-menu--inline': !props.fullWidth && !!slots.activator },
        directives: [{ arg: 500, name: 'resize', value: onResize }],
        on: props.disableKeys ? undefined : { keydown: menuKeyable.onKeyDown }
      }

      return h('div', data, [
        menuGenerators.genActivator(),
        h(ThemeProvider, { props: { root: true, light: props.light, dark: props.dark } }, [menuGenerators.genTransition()])
      ])
    }
  }
})
