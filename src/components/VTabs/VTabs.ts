import '@/css/vuetify.css'

import { BaseItemGroup } from '../VItemGroup/VItemGroup'

import useColorable from '../../composables/useColorable'
import useSsrBootable from '../../composables/useSsrBootable'
import useThemeable from '../../composables/useThemeable'
import useTabsComputed from './composables/useTabsComputed'
import useTabsGenerators from './composables/useTabsGenerators'
import useTabsProps, { tabsProps } from './composables/useTabsProps'
import useTabsTouch from './composables/useTabsTouch'
import useTabsWatchers from './composables/useTabsWatchers'

import Resize from '../../directives/resize'
import Touch from '../../directives/touch'

import ThemeProvider from '../../util/ThemeProvider'
import { deprecate } from '../../util/console'

import { defineComponent, getCurrentInstance, h, nextTick, onBeforeUnmount, onMounted, provide, reactive, ref, watch } from 'vue'
import type { VNodeArrayChildren } from 'vue'

type Direction = 'prev' | 'next'

type TabItemsFn = (val: any) => void

type ParsedNodes = {
  tab: VNodeArrayChildren,
  slider: VNodeArrayChildren,
  items: VNodeArrayChildren,
  item: VNodeArrayChildren
}

const TRANSITION_TIME = 300

const VTabs = defineComponent({
  name: 'v-tabs',

  extends: BaseItemGroup,

  directives: {
    Resize,
    Touch
  },

  props: {
    ...tabsProps,
    color: String
  },

  setup (props, { attrs, slots }) {
    const vm = getCurrentInstance()
    const proxy = vm?.proxy as any

    const { setBackgroundColor } = useColorable(props)
    const { themeClasses, isDark } = useThemeable(props)
    const { isBooted } = useSsrBootable()

    const propsRefs = useTabsProps(props)
    const computedRefs = useTabsComputed(props)
    const generators = useTabsGenerators()
    const touchHandlers = useTabsTouch()

    const isOverflowing = ref(false)
    const nextIconVisible = ref(false)
    const prevIconVisible = ref(false)
    const resizeTimeout = ref<number | undefined>(undefined)
    const scrollOffset = ref(0)
    const sliderWidth = ref<number | null>(null)
    const sliderLeft = ref<number | null>(null)
    const startX = ref(0)
    const tabItems = ref<TabItemsFn | null>(null)
    const widths = reactive({ bar: 0, container: 0, wrapper: 0 })

    function checkPrevIcon () {
      return scrollOffset.value > 0
    }

    function checkNextIcon () {
      return widths.container > scrollOffset.value + widths.wrapper
    }

    function checkIcons () {
      prevIconVisible.value = checkPrevIcon()
      nextIconVisible.value = checkNextIcon()
    }

    function callSlider () {
      if (props.hideSlider || !computedRefs.activeTab.value) return false

      nextTick(() => {
        const active = computedRefs.activeTab.value as any
        const el: HTMLElement | null = active && (active.$el || active.el || active)
        if (!el) return

        sliderWidth.value = el.scrollWidth || 0
        sliderLeft.value = el.offsetLeft || 0
      })

      return true
    }

    function init () {
      const onInput = (attrs as any)?.onInput
      if (onInput) {
        deprecate('@input', '@change', proxy)
      }
    }

    function onResize () {
      if (proxy && proxy._isDestroyed) return

      setWidths()

      const delay = isBooted.value ? TRANSITION_TIME : 0

      if (resizeTimeout.value !== undefined) {
        window.clearTimeout(resizeTimeout.value)
      }

      resizeTimeout.value = window.setTimeout(() => {
        updateTabsView()
      }, delay)
    }

    function overflowCheck (e: any, fn: (event: any) => void) {
      if (isOverflowing.value) fn(e)
    }

    function scrollTo (direction: Direction) {
      scrollOffset.value = touchHandlers.newOffset(direction)
    }

    function setOverflow () {
      isOverflowing.value = widths.bar < widths.container
    }

    function setWidths () {
      const barRef = proxy?.$refs?.bar as HTMLElement | undefined
      const containerRef = proxy?.$refs?.container as HTMLElement | undefined
      const wrapperRef = proxy?.$refs?.wrapper as HTMLElement | undefined

      widths.bar = barRef ? barRef.clientWidth : 0
      widths.container = containerRef ? containerRef.clientWidth : 0
      widths.wrapper = wrapperRef ? wrapperRef.clientWidth : 0

      setOverflow()
    }

    function parseNodes (): ParsedNodes {
      const defaultNodes = slots.default?.() ?? []
      const tab: VNodeArrayChildren = []
      const slider: VNodeArrayChildren = []
      const items: VNodeArrayChildren = []
      const item: VNodeArrayChildren = []

      defaultNodes.forEach(vnode => {
        const type: any = vnode.type
        const options = type?.options || {}
        const name = options.name || type?.name

        switch (name) {
          case 'v-tabs-slider':
            slider.push(vnode)
            break
          case 'v-tabs-items':
            items.push(vnode)
            break
          case 'v-tab-item':
            item.push(vnode)
            break
          default:
            tab.push(vnode)
        }
      })

      return { tab, slider, items, item }
    }

    function registerItems (fn: TabItemsFn) {
      tabItems.value = fn
      fn(proxy?.internalValue)
    }

    function unregisterItems () {
      tabItems.value = null
    }

    function updateTabsView () {
      callSlider()
      scrollIntoView()
      checkIcons()
    }

    function scrollIntoView () {
      const active = computedRefs.activeTab.value as any
      if (!active) return

      if (!isOverflowing.value) {
        scrollOffset.value = 0
        return
      }

      const el: HTMLElement | null = active.$el || active.el || active
      if (!el) return

      const totalWidth = widths.wrapper + scrollOffset.value
      const clientWidth = el.clientWidth
      const offsetLeft = el.offsetLeft
      const itemOffset = clientWidth + offsetLeft

      const items = proxy?.items || []
      let additionalOffset = clientWidth * 0.3

      if (items[items.length - 1] === active) {
        additionalOffset = 0
      }

      if (offsetLeft < scrollOffset.value) {
        scrollOffset.value = Math.max(offsetLeft - additionalOffset, 0)
      } else if (totalWidth < itemOffset) {
        scrollOffset.value -= totalWidth - itemOffset - additionalOffset
      }
    }

    function tabProxy (val: any) {
      if (proxy) {
        proxy.internalValue = val
      }
    }

    if (proxy) {
      Object.assign(proxy, generators, touchHandlers, {
        checkIcons,
        checkNextIcon,
        checkPrevIcon,
        callSlider,
        init,
        onResize,
        overflowCheck,
        scrollIntoView,
        scrollTo,
        setOverflow,
        setWidths,
        parseNodes,
        registerItems,
        unregisterItems,
        updateTabsView,
        tabProxy,
        setBackgroundColor,
      })

      Object.defineProperties(proxy, {
        activeTab: {
          get: () => computedRefs.activeTab.value
        },
        containerStyles: {
          get: () => computedRefs.containerStyles.value
        },
        hasArrows: {
          get: () => computedRefs.hasArrows.value
        },
        isBooted: {
          get: () => isBooted.value
        },
        isMobile: {
          get: () => computedRefs.isMobile.value
        },
        isOverflowing: {
          get: () => isOverflowing.value,
          set: (val: boolean) => { isOverflowing.value = val }
        },
        nextIconVisible: {
          get: () => nextIconVisible.value,
          set: (val: boolean) => { nextIconVisible.value = val }
        },
        prevIconVisible: {
          get: () => prevIconVisible.value,
          set: (val: boolean) => { prevIconVisible.value = val }
        },
        scrollOffset: {
          get: () => scrollOffset.value,
          set: (val: number) => { scrollOffset.value = val }
        },
        sliderLeft: {
          get: () => sliderLeft.value,
          set: (val: number | null) => { sliderLeft.value = val }
        },
        sliderStyles: {
          get: () => computedRefs.sliderStyles.value
        },
        sliderWidth: {
          get: () => sliderWidth.value,
          set: (val: number | null) => { sliderWidth.value = val }
        },
        startX: {
          get: () => startX.value,
          set: (val: number) => { startX.value = val }
        },
        tabItems: {
          get: () => tabItems.value,
          set: (val: TabItemsFn | null) => { tabItems.value = val }
        },
        themeClasses: {
          get: () => themeClasses.value
        },
        transitionTime: {
          get: () => TRANSITION_TIME
        },
        widths: {
          get: () => widths
        },
        color: {
          get: () => props.color
        }
      })
    }

    useTabsWatchers(propsRefs, attrs, computedRefs)

    watch(() => (proxy?.items || []).length, () => onResize())
    watch(() => slots.default?.()?.length, () => onResize())

    onMounted(() => {
      init()
    })

    onBeforeUnmount(() => {
      if (resizeTimeout.value !== undefined) {
        window.clearTimeout(resizeTimeout.value)
      }
    })

    if (proxy) {
      provide('tabGroup', proxy)
      provide('tabProxy', tabProxy)
      provide('registerItems', registerItems)
      provide('unregisterItems', unregisterItems)
    }

    return () => {
      const { tab, slider, items, item } = parseNodes()

      return h('div', {
        staticClass: 'v-tabs',
        directives: [{
          name: 'resize',
          modifiers: { quiet: true },
          value: onResize
        }]
      }, [
        generators.genBar([props.hideSlider ? null : generators.genSlider(slider), tab]),
        h(ThemeProvider, {
          props: { dark: isDark.value, light: !isDark.value }
        }, [generators.genItems(items, item)])
      ])
    }
  }
})

;(VTabs as any).extend = (ext: any) => defineComponent({ ...ext, extends: VTabs })

export default VTabs
