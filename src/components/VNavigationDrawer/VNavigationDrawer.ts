// Styles
import "@/css/vuetify.css"

// Directives
import ClickOutside from '../../directives/click-outside'
import Resize from '../../directives/resize'
import Touch, { TouchWrapper } from '../../directives/touch'

// Composables
import useApplicationable from '../../composables/useApplicationable'
import useDependent from '../../composables/useDependent'
import useOverlayable, { overlayableProps } from '../../composables/useOverlayable'
import useSsrBootable from '../../composables/useSsrBootable'
import useThemeable, { themeProps } from '../../composables/useThemeable'
import { positionPropsFactory } from '../../composables/usePositionable'

// Utilities
import { convertToUnit } from '../../util/helpers'

// Types
import { defineComponent, h, ref, reactive, computed, watch, onBeforeMount, getCurrentInstance, PropType } from 'vue'

export default defineComponent({
  name: 'v-navigation-drawer',

  directives: {
    ClickOutside,
    Resize,
    Touch
  },

  props: {
    app: Boolean,
    ...positionPropsFactory(['absolute', 'fixed']),
    ...overlayableProps,
    ...themeProps,
    clipped: Boolean,
    disableRouteWatcher: Boolean,
    disableResizeWatcher: Boolean,
    height: {
      type: [Number, String] as PropType<number | string>,
      default: '100%'
    },
    floating: Boolean,
    miniVariant: Boolean,
    miniVariantWidth: {
      type: [Number, String] as PropType<number | string>,
      default: 80
    },
    mobileBreakPoint: {
      type: [Number, String] as PropType<number | string>,
      default: 1264
    },
    permanent: Boolean,
    right: Boolean,
    stateless: Boolean,
    temporary: Boolean,
    touchless: Boolean,
    width: {
      type: [Number, String] as PropType<number | string>,
      default: 300
    },
    value: {
      type: null as PropType<any>,
      required: false
    }
  },

  setup (props, { emit, slots }) {
    useSsrBootable()
    const vm = getCurrentInstance()
    const drawer = ref<HTMLElement | null>(null)
    const touchArea = reactive({ left: 0, right: 0 })

    const { themeClasses } = useThemeable(props)
    const dependent = useDependent()
    const { isActive, getOpenDependentElements } = dependent

    const applicationProperty = computed(() => (props.right ? 'right' : 'left'))
    const { app, callUpdate, setUpdateApplication } = useApplicationable(props, applicationProperty, ['miniVariant', 'right', 'width'])

    const { genOverlay, removeOverlay } = useOverlayable(props, {
      absolute: computed(() => props.absolute),
      isActive
    })

    const calculatedWidth = computed(() => {
      const source = props.miniVariant ? props.miniVariantWidth : props.width
      return parseInt(source as any, 10)
    })

    const calculatedTransform = computed(() => {
      if (isActive.value) return 0

      return props.right
        ? calculatedWidth.value
        : -calculatedWidth.value
    })

    const isMobile = computed(() => {
      if (props.stateless || props.permanent || props.temporary) return false

      const breakpointWidth = parseInt(props.mobileBreakPoint as any, 10)
      const currentWidth = vm?.proxy.$vuetify.breakpoint.width || 0

      return currentWidth < breakpointWidth
    })

    const hasApp = computed(() => app.value && (!isMobile.value && !props.temporary))

    const marginTop = computed(() => {
      if (!hasApp.value) return 0

      let margin = vm?.proxy.$vuetify.application.bar
      if (props.clipped) margin += vm?.proxy.$vuetify.application.top
      return margin
    })

    const maxHeight = computed(() => {
      if (!hasApp.value) return null

      const application = vm?.proxy.$vuetify.application
      const base = application.bottom + application.footer + application.bar

      return props.clipped ? base + application.top : base
    })

    const reactsToClick = computed(() => !props.stateless && !props.permanent && (isMobile.value || props.temporary))
    const reactsToMobile = computed(() => !props.disableResizeWatcher && !props.stateless && !props.permanent && !props.temporary)
    const reactsToRoute = computed(() => !props.disableRouteWatcher && !props.stateless && (props.temporary || isMobile.value))
    const resizeIsDisabled = computed(() => props.disableResizeWatcher || props.stateless)

    const showOverlay = computed(() => isActive.value && (isMobile.value || props.temporary))

    const styles = computed(() => ({
      height: convertToUnit(props.height),
      marginTop: `${marginTop.value}px`,
      maxHeight: maxHeight.value != null ? `calc(100% - ${+maxHeight.value}px)` : undefined,
      transform: `translateX(${calculatedTransform.value}px)`,
      width: `${calculatedWidth.value}px`
    }))

    const classes = computed(() => ({
      'v-navigation-drawer': true,
      'v-navigation-drawer--absolute': props.absolute,
      'v-navigation-drawer--clipped': props.clipped,
      'v-navigation-drawer--close': !isActive.value,
      'v-navigation-drawer--fixed': !props.absolute && (app.value || props.fixed),
      'v-navigation-drawer--floating': props.floating,
      'v-navigation-drawer--is-mobile': isMobile.value,
      'v-navigation-drawer--mini-variant': props.miniVariant,
      'v-navigation-drawer--open': isActive.value,
      'v-navigation-drawer--right': props.right,
      'v-navigation-drawer--temporary': props.temporary,
      ...themeClasses.value
    }))

    setUpdateApplication(() => {
      return !isActive.value || props.temporary || isMobile.value
        ? 0
        : calculatedWidth.value
    })

    function calculateTouchArea () {
      const parent = drawer.value?.parentElement
      if (!parent) return

      const parentRect = parent.getBoundingClientRect()
      touchArea.left = parentRect.left + 50
      touchArea.right = parentRect.right - 50
    }

    function closeConditional () {
      return isActive.value && !(vm?.isUnmounted) && reactsToClick.value
    }

    const deactivateDrawer = () => { isActive.value = false }

    function genDirectives () {
      const directives: any[] = [{
        name: 'click-outside',
        value: deactivateDrawer,
        args: {
          closeConditional,
          include: getOpenDependentElements
        }
      }]

      if (!props.touchless) {
        directives.push({
          name: 'touch',
          value: {
            parent: true,
            left: swipeLeft,
            right: swipeRight
          }
        })
      }

      return directives
    }

    function init () {
      if (props.permanent) {
        isActive.value = true
      } else if (props.stateless || props.value != null) {
        isActive.value = Boolean(props.value)
      } else if (!props.temporary) {
        isActive.value = !isMobile.value
      }
    }

    function swipeRight (e: TouchWrapper) {
      if (isActive.value && !props.right) return
      calculateTouchArea()

      if (Math.abs(e.touchendX - e.touchstartX) < 100) return
      if (!props.right && e.touchstartX <= touchArea.left) {
        isActive.value = true
      } else if (props.right && isActive.value) {
        isActive.value = false
      }
    }

    function swipeLeft (e: TouchWrapper) {
      if (isActive.value && props.right) return
      calculateTouchArea()

      if (Math.abs(e.touchendX - e.touchstartX) < 100) return
      if (props.right && e.touchstartX >= touchArea.right) {
        isActive.value = true
      } else if (!props.right && isActive.value) {
        isActive.value = false
      }
    }

    watch(() => vm?.proxy?.$route, () => {
      if (reactsToRoute.value && closeConditional()) {
        isActive.value = false
      }
    })

    watch(isActive, val => {
      emit('input', val)
      callUpdate()
    })

    watch(isMobile, (val, prev) => {
      if (!val && isActive.value && !props.temporary) {
        removeOverlay()
      }

      if (prev == null || resizeIsDisabled.value || !reactsToMobile.value) return

      isActive.value = !val
      callUpdate()
    })

    watch(() => props.permanent, val => {
      if (val) {
        isActive.value = true
      }
      callUpdate()
    })

    watch(showOverlay, val => {
      if (val) genOverlay()
      else removeOverlay()
    })

    watch(() => props.temporary, callUpdate)

    watch(() => props.value, val => {
      if (props.permanent) return
      if (val == null) return init()

      if (val !== isActive.value) isActive.value = val
    })

    onBeforeMount(() => {
      init()
    })

    return () => {
      const onDrawerClick = () => {
        if (!props.miniVariant) return

        emit('update:miniVariant', false)
      }

      const onDrawerTransitionEnd = (e: Event) => {
        if (e.target !== e.currentTarget) return

        emit('transitionend', e)

        const resizeEvent = document.createEvent('UIEvents')
        resizeEvent.initUIEvent('resize', true, false, window, 0)
        window.dispatchEvent(resizeEvent)
      }

      const data = {
        class: classes.value,
        style: styles.value,
        directives: genDirectives(),
        ref: drawer,
        on: {
          click: onDrawerClick,
          transitionend: onDrawerTransitionEnd
        }
      }

      return h('aside', data, [
        slots.default?.(),
        h('div', { class: 'v-navigation-drawer__border' })
      ])
    }
  }
})
