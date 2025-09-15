// Styles
import "@/css/vuetify.css"

// Composables
import useApplicationable from '../../composables/useApplicationable'
import useColorable, { colorProps } from '../../composables/useColorable'
import useSsrBootable from '../../composables/useSsrBootable'
import useThemeable, { themeProps } from '../../composables/useThemeable'

// Directives
import Scroll from '../../directives/scroll'
import { deprecate } from '../../util/console'

// Types
import { defineComponent, getCurrentInstance, h, computed, ref, watch, onMounted } from 'vue'

export default defineComponent({
  name: 'v-toolbar',

  directives: { Scroll },

  props: {
    card: Boolean,
    clippedLeft: Boolean,
    clippedRight: Boolean,
    dense: Boolean,
    extended: Boolean,
    extensionHeight: {
      type: [Number, String],
      validator: (v: any) => !isNaN(parseInt(v))
    },
    flat: Boolean,
    floating: Boolean,
    height: {
      type: [Number, String],
      validator: (v: any) => !isNaN(parseInt(v))
    },
    invertedScroll: Boolean,
    manualScroll: Boolean,
    prominent: Boolean,
    scrollOffScreen: Boolean,
    /* @deprecated */
    scrollToolbarOffScreen: Boolean,
    scrollTarget: String,
    scrollThreshold: {
      type: Number,
      default: 300
    },
    tabs: Boolean,
    app: Boolean,
    absolute: Boolean,
    fixed: Boolean,
    ...colorProps,
    ...themeProps
  },

  setup (props, { slots, attrs }) {
    const vm = getCurrentInstance()
    const heights = {
      mobileLandscape: 48,
      mobile: 56,
      desktop: 64,
      dense: 48
    }

    const currentScroll = ref(0)
    const previousScroll = ref(0)
    const savedScroll = ref(0)
    const isScrollingUp = ref(false)
    const target = ref<Element | null>(null)
    const isActive = ref(!(props.invertedScroll || props.manualScroll))

    const { setBackgroundColor } = useColorable(props)
    const { themeClasses } = useThemeable(props)
    const { isBooted } = useSsrBootable()
    const { app, applicationProperty } = useApplicationable(props, computed(() => 'top'))

    const isExtended = computed(() => props.extended || !!slots.extension)

    const breakpoint = computed(() => vm?.proxy.$vuetify.breakpoint)

    const canScroll = computed(() => {
      if (props.scrollToolbarOffScreen) {
        deprecate('scrollToolbarOffScreen', 'scrollOffScreen', vm?.proxy)

        return true
      }

      return props.scrollOffScreen || props.invertedScroll
    })

    const computedContentHeight = computed(() => {
      if (props.height) return parseInt(props.height as any)
      if (props.dense) return heights.dense

      const bp = breakpoint.value
      if (!bp) return heights.mobile

      if (props.prominent || bp.mdAndUp) return heights.desktop

      if (bp.smAndDown && bp.width > bp.height) return heights.mobileLandscape

      return heights.mobile
    })

    const computedExtensionHeight = computed(() => {
      if (props.tabs) return 48
      if (props.extensionHeight) return parseInt(props.extensionHeight as any)

      return computedContentHeight.value
    })

    const computedHeight = computed(() => {
      if (!isExtended.value) return computedContentHeight.value

      return computedContentHeight.value + computedExtensionHeight.value
    })

    const computedMarginTop = computed(() => {
      if (!app.value) return 0

      return vm?.proxy.$vuetify.application.bar || 0
    })

    const computedPaddingLeft = computed(() => {
      if (!app.value || props.clippedLeft) return 0

      return vm?.proxy.$vuetify.application.left || 0
    })

    const computedPaddingRight = computed(() => {
      if (!app.value || props.clippedRight) return 0

      return vm?.proxy.$vuetify.application.right || 0
    })

    const computedTransform = computed(() => {
      if (isActive.value) return 0

      return canScroll.value
        ? -computedContentHeight.value
        : -computedHeight.value
    })

    const styles = computed(() => ({
      marginTop: `${computedMarginTop.value}px`,
      paddingRight: `${computedPaddingRight.value}px`,
      paddingLeft: `${computedPaddingLeft.value}px`,
      transform: `translateY(${computedTransform.value}px)`
    }))

    const classes = computed(() => ({
      'v-toolbar': true,
      'elevation-0': props.flat || (!isActive.value && !props.tabs && canScroll.value),
      'v-toolbar--absolute': props.absolute,
      'v-toolbar--card': props.card,
      'v-toolbar--clipped': props.clippedLeft || props.clippedRight,
      'v-toolbar--dense': props.dense,
      'v-toolbar--extended': isExtended.value,
      'v-toolbar--fixed': !props.absolute && (app.value || props.fixed),
      'v-toolbar--floating': props.floating,
      'v-toolbar--prominent': props.prominent,
      ...themeClasses.value
    }))

    const currentThreshold = computed(() => Math.abs(currentScroll.value - savedScroll.value))

    function updateApplication () {
      if (props.invertedScroll || props.manualScroll) return 0

      return computedHeight.value
    }

    function callUpdate () {
      if (!app.value || !vm) return

      vm.proxy.$vuetify.application.bind(vm.uid, applicationProperty.value, updateApplication())
    }

    watch(() => props.app, val => {
      if (val) callUpdate()
    })

    watch(() => [
      computedHeight.value,
      props.clippedLeft,
      props.clippedRight,
      props.invertedScroll,
      props.manualScroll
    ], () => {
      callUpdate()
    }, { immediate: true })

    watch(currentThreshold, val => {
      if (props.invertedScroll) {
        isActive.value = currentScroll.value > props.scrollThreshold
        return
      }

      if (val < props.scrollThreshold || !isBooted.value) return

      isActive.value = isScrollingUp.value
      savedScroll.value = currentScroll.value
    })

    watch(isActive, () => {
      savedScroll.value = 0
      callUpdate()
    })

    watch(() => props.invertedScroll, val => {
      isActive.value = !val
      callUpdate()
    })

    watch(() => props.manualScroll, val => {
      isActive.value = !val
      callUpdate()
    })

    watch(isScrollingUp, () => {
      savedScroll.value = savedScroll.value || currentScroll.value
    })

    function onScroll () {
      if (!canScroll.value || props.manualScroll || typeof window === 'undefined') return

      currentScroll.value = target.value
        ? (target.value as HTMLElement).scrollTop
        : window.pageYOffset

      isScrollingUp.value = currentScroll.value < previousScroll.value

      previousScroll.value = currentScroll.value
    }

    watch(() => props.scrollTarget, val => {
      if (typeof document === 'undefined') {
        target.value = null
        return
      }

      target.value = val ? document.querySelector(val) : null
    }, { immediate: true })

    onMounted(() => {
      callUpdate()
    })

    return () => {
      const { class: classAttr, style: styleAttr, ...restAttrs } = attrs
      const defaultSlot = slots.default?.()
      const extensionSlot = slots.extension?.()

      const data = setBackgroundColor(props.color, {
        class: [classes.value, classAttr],
        style: [styles.value, styleAttr],
        ...restAttrs,
        directives: [{
          arg: props.scrollTarget,
          name: 'scroll',
          value: onScroll
        }]
      })

      const children = [
        h('div', {
          staticClass: 'v-toolbar__content',
          style: { height: `${computedContentHeight.value}px` }
        }, defaultSlot)
      ]

      if (isExtended.value || extensionSlot) {
        children.push(h('div', {
          staticClass: 'v-toolbar__extension',
          style: { height: `${computedExtensionHeight.value}px` }
        }, extensionSlot))
      }

      return h('nav', data, children)
    }
  }
})
