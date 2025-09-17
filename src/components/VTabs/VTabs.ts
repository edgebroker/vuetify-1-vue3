import '@/css/vuetify.css'

// Extensions
import { BaseItemGroup } from '../VItemGroup/VItemGroup'

// Composables
import useColorable, { colorProps } from '../../composables/useColorable'
import useSsrBootable from '../../composables/useSsrBootable'
import useThemeable, { themeProps } from '../../composables/useThemeable'
import useTabsComputed from './composables/useTabsComputed'
import useTabsGenerators from './composables/useTabsGenerators'
import useTabsProps, { tabsProps } from './composables/useTabsProps'
import useTabsTouch from './composables/useTabsTouch'
import useTabsWatchers from './composables/useTabsWatchers'

// Directives
import Resize from '../../directives/resize'
import Touch from '../../directives/touch'

// Utils
import ThemeProvider from '../../util/ThemeProvider'
import { deprecate } from '../../util/console'

// Types
import {
  Fragment,
  VNode,
  VNodeArrayChildren,
  defineComponent,
  getCurrentInstance,
  h,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  reactive,
  ref,
  watch,
  withDirectives
} from 'vue'

type TabItemsFn = ((val: any) => void) | null

type ParsedNodes = {
  tab: VNodeArrayChildren
  slider: VNodeArrayChildren
  items: VNodeArrayChildren
  item: VNodeArrayChildren
}

function isComponentVNode (node: any): node is VNode {
  return node && typeof node === 'object' && 'type' in node
}

export default defineComponent({
  name: 'v-tabs',

  extends: BaseItemGroup,

  directives: { Resize, Touch },

  props: {
    ...tabsProps,
    ...colorProps,
    ...themeProps
  },

  setup (props, { attrs, slots }) {
    const vm = getCurrentInstance()
    const proxy = vm?.proxy as any

    const { setBackgroundColor } = useColorable(props)
    const { themeClasses, theme } = useThemeable(props)
    const { isBooted } = useSsrBootable()
    const propsRefs = useTabsProps(props)

    const isOverflowing = ref(false)
    const nextIconVisible = ref(false)
    const prevIconVisible = ref(false)
    const resizeTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
    const scrollOffset = ref(0)
    const sliderWidth = ref<number | null>(null)
    const sliderLeft = ref<number | null>(null)
    const startX = ref(0)
    const tabItems = ref<TabItemsFn>(null)
    const transitionTime = ref(300)
    const widths = reactive({
      bar: 0,
      container: 0,
      wrapper: 0
    })

    if (proxy) {
      Object.assign(proxy, { setBackgroundColor })

      Object.defineProperties(proxy, {
        isBooted: {
          get: () => isBooted.value
        },
        themeClasses: {
          get: () => themeClasses.value
        },
        theme: {
          get: () => theme
        },
        isOverflowing: {
          get: () => isOverflowing.value,
          set: (val: boolean) => { isOverflowing.value = Boolean(val) }
        },
        nextIconVisible: {
          get: () => nextIconVisible.value,
          set: (val: boolean) => { nextIconVisible.value = Boolean(val) }
        },
        prevIconVisible: {
          get: () => prevIconVisible.value,
          set: (val: boolean) => { prevIconVisible.value = Boolean(val) }
        },
        resizeTimeout: {
          get: () => resizeTimeout.value,
          set: (val: ReturnType<typeof setTimeout> | null) => { resizeTimeout.value = val }
        },
        scrollOffset: {
          get: () => scrollOffset.value,
          set: (val: number) => { scrollOffset.value = Number(val) }
        },
        sliderWidth: {
          get: () => sliderWidth.value,
          set: (val: number | null) => { sliderWidth.value = val == null ? null : Number(val) }
        },
        sliderLeft: {
          get: () => sliderLeft.value,
          set: (val: number | null) => { sliderLeft.value = val == null ? null : Number(val) }
        },
        startX: {
          get: () => startX.value,
          set: (val: number) => { startX.value = Number(val) }
        },
        tabItems: {
          get: () => tabItems.value,
          set: (val: TabItemsFn) => { tabItems.value = val }
        },
        transitionTime: {
          get: () => transitionTime.value,
          set: (val: number) => { transitionTime.value = Number(val) }
        },
        widths: {
          get: () => widths
        }
      })
    }

    const computedRefs = useTabsComputed(props)
    const generators = useTabsGenerators()
    const touchHandlers = useTabsTouch()

    if (proxy) {
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
        isMobile: {
          get: () => computedRefs.isMobile.value
        },
        sliderStyles: {
          get: () => computedRefs.sliderStyles.value
        }
      })
    }

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

      const activeTab = computedRefs.activeTab.value as any

      nextTick(() => {
        const el = activeTab && activeTab.$el
        if (!el) return
        sliderWidth.value = el.scrollWidth
        sliderLeft.value = el.offsetLeft
      })

      return true
    }

    function init () {
      const hasInputListener = Boolean((attrs as Record<string, any>)?.onInput)
      if (hasInputListener) {
        deprecate('@input', '@change', proxy)
      }
    }

    function setOverflow () {
      isOverflowing.value = widths.bar < widths.container
    }

    function setWidths () {
      const bar = proxy?.$refs?.bar ? proxy.$refs.bar.clientWidth : 0
      const container = proxy?.$refs?.container ? proxy.$refs.container.clientWidth : 0
      const wrapper = proxy?.$refs?.wrapper ? proxy.$refs.wrapper.clientWidth : 0

      widths.bar = bar
      widths.container = container
      widths.wrapper = wrapper

      setOverflow()
    }

    function scrollIntoView () {
      const active = computedRefs.activeTab.value as any
      if (!active) return

      if (!isOverflowing.value) {
        scrollOffset.value = 0
        return
      }

      const totalWidth = widths.wrapper + scrollOffset.value
      const el = active.$el
      if (!el) return

      const { clientWidth, offsetLeft } = el
      const itemOffset = clientWidth + offsetLeft
      let additionalOffset = clientWidth * 0.3
      const items: any[] = proxy?.items || []

      if (items.length && active === items[items.length - 1]) {
        additionalOffset = 0
      }

      if (offsetLeft < scrollOffset.value) {
        scrollOffset.value = Math.max(offsetLeft - additionalOffset, 0)
      } else if (totalWidth < itemOffset) {
        scrollOffset.value -= totalWidth - itemOffset - additionalOffset
      }
    }

    function updateTabsView () {
      callSlider()
      scrollIntoView()
      checkIcons()
    }

    function overflowCheck (e: any, fn: ((e: any) => void) | undefined) {
      if (isOverflowing.value && typeof fn === 'function') {
        fn(e)
      }
    }

    function newOffset (direction: 'prev' | 'next') {
      return touchHandlers.newOffset(direction)
    }

    function scrollTo (direction: 'prev' | 'next') {
      scrollOffset.value = newOffset(direction)
    }

    function onResize () {
      setWidths()

      const delay = isBooted.value ? transitionTime.value : 0
      if (resizeTimeout.value != null) clearTimeout(resizeTimeout.value)

      resizeTimeout.value = setTimeout(() => {
        updateTabsView()
      }, delay)
    }

    function parseNodes (): ParsedNodes {
      const tab: VNodeArrayChildren = []
      const slider: VNodeArrayChildren = []
      const items: VNodeArrayChildren = []
      const item: VNodeArrayChildren = []

      const children = slots.default?.() ?? []

      const traverse = (vnodes: VNodeArrayChildren) => {
        vnodes.forEach((vnode: any) => {
          if (Array.isArray(vnode)) {
            traverse(vnode as unknown as VNodeArrayChildren)
            return
          }

          if (vnode == null || typeof vnode === 'boolean') return

          if (typeof vnode === 'string') {
            tab.push(vnode)
            return
          }

          if (vnode.type === Fragment && Array.isArray(vnode.children)) {
            traverse(vnode.children as VNodeArrayChildren)
            return
          }

          if (!isComponentVNode(vnode)) {
            tab.push(vnode as any)
            return
          }

          const type: any = vnode.type
          const name = type?.options?.name || type?.name

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
      }

      traverse(children as VNodeArrayChildren)

      return { tab, slider, items, item }
    }

    function registerItems (fn: TabItemsFn) {
      tabItems.value = fn
      if (fn && proxy) {
        fn(proxy.internalValue)
      }
    }

    function unregisterItems () {
      tabItems.value = null
    }

    function tabProxy (val: any) {
      if (proxy) proxy.internalValue = val
    }

    if (proxy) {
      Object.assign(proxy, {
        checkIcons,
        checkPrevIcon,
        checkNextIcon,
        callSlider,
        init,
        onResize,
        overflowCheck,
        scrollTo,
        setOverflow,
        setWidths,
        parseNodes,
        registerItems,
        unregisterItems,
        updateTabsView,
        scrollIntoView,
        tabProxy,
        newOffset
      })

      Object.assign(proxy, generators, touchHandlers)
    }

    useTabsWatchers(propsRefs, attrs, computedRefs)

    provide('tabGroup', proxy || null)
    provide('tabProxy', tabProxy)
    provide('registerItems', registerItems)
    provide('unregisterItems', unregisterItems)

    watch(() => proxy?.items && proxy.items.length, () => {
      onResize()
    })

    onMounted(() => {
      init()
      nextTick(() => {
        onResize()
      })
    })

    onBeforeUnmount(() => {
      if (resizeTimeout.value != null) {
        clearTimeout(resizeTimeout.value)
      }
    })

    return () => {
      const { tab, slider, items, item } = parseNodes()

      const barChildren = [props.hideSlider ? null : generators.genSlider(slider), tab]

      const bar = generators.genBar(barChildren)
      const content = generators.genItems(items, item)
      const contentChildren = Array.isArray(content)
        ? content
        : content != null
          ? [content]
          : []

      const themedItems = h(ThemeProvider, {
        dark: theme.isDark,
        light: !theme.isDark
      }, {
        default: () => contentChildren
      })

      const vnode = h('div', {
        staticClass: 'v-tabs'
      }, [bar, themedItems])

      return withDirectives(vnode, [[Resize, onResize, undefined, { quiet: true }]])
    }
  }
})
