import '@/css/vuetify.css'

// Directives
import ClickOutside from '../../directives/click-outside'

// Composables
import useBootable from '../../composables/useBootable'
import useDependent from '../../composables/useDependent'
import useDetachable, { detachableProps } from '../../composables/useDetachable'
import useOverlayable, { overlayableProps } from '../../composables/useOverlayable'
import useReturnable, { returnableProps } from '../../composables/useReturnable'
import useStackable from '../../composables/useStackable'
import useToggleable from '../../composables/useToggleable'

// Helpers
import { convertToUnit, keyCodes, getSlotType } from '../../util/helpers'
import ThemeProvider from '../../util/ThemeProvider'
import { consoleError } from '../../util/console'

// Types
import { defineComponent, h, ref, computed, watch, nextTick, onMounted, onBeforeUnmount, withDirectives, vShow } from 'vue'

export default defineComponent({
  name: 'v-dialog',

  directives: { ClickOutside },

  props: {
    ...detachableProps,
    ...overlayableProps,
    ...returnableProps,
    disabled: Boolean,
    persistent: Boolean,
    fullscreen: Boolean,
    fullWidth: Boolean,
    noClickAnimation: Boolean,
    light: Boolean,
    dark: Boolean,
    maxWidth: {
      type: [String, Number],
      default: 'none'
    },
    origin: {
      type: String,
      default: 'center center'
    },
    width: {
      type: [String, Number],
      default: 'auto'
    },
    scrollable: Boolean,
    transition: {
      type: [String, Boolean],
      default: 'dialog-transition'
    },
    lazy: Boolean,
    value: null
  },

  setup (props, { slots, emit }) {
    const dialog = ref(null)
    const content = ref(null)
    const activatorRef = ref(null)
    const activatorNode = ref(null)
    const activatedBy = ref(null)
    const animate = ref(false)
    let animateTimeout = null

    const { isActive } = useToggleable(props, emit)
    const bootable = useBootable(props, { isActive })
    const dependent = useDependent()
    const { stackClass, stackMinZIndex, activeZIndex, stackElement, isActive: stackIsActive, getMaxZIndex } = useStackable()
    stackClass.value = 'v-dialog__content--active'
    stackMinZIndex.value = 200
    stackElement.value = content

    const { getScopeIdAttrs } = useDetachable(props, { activator: activatorNode, content, isActive })
    const { overlay, genOverlay, removeOverlay, hideScroll: overlayHideScroll, showScroll } = useOverlayable(props, { activeZIndex, content, dialog, isActive })
    useReturnable(props, { isActive, emit })

    const classes = computed(() => ({
      [`v-dialog ${props.contentClass}`.trim()]: true,
      'v-dialog--active': isActive.value,
      'v-dialog--persistent': props.persistent,
      'v-dialog--fullscreen': props.fullscreen,
      'v-dialog--scrollable': props.scrollable,
      'v-dialog--animated': animate.value
    }))

    const contentClasses = computed(() => ({
      'v-dialog__content': true,
      'v-dialog__content--active': isActive.value
    }))

    const hasActivator = computed(() => !!slots.activator)

    function animateClick () {
      animate.value = false
      nextTick(() => {
        animate.value = true
        clearTimeout(animateTimeout)
        animateTimeout = setTimeout(() => (animate.value = false), 150)
      })
    }

    function closeConditional (e) {
      if (!isActive.value || (content.value && content.value.contains(e.target))) return false

      if (props.persistent) {
        if (!props.noClickAnimation && overlay.value === e.target) {
          animateClick()
        }
        return false
      }

      return activeZIndex.value >= getMaxZIndex()
    }

    function hideScroll () {
      if (props.fullscreen) {
        document.documentElement.classList.add('overflow-y-hidden')
      } else {
        overlayHideScroll()
      }
    }

    function show () {
      if (!props.fullscreen && !props.hideOverlay) genOverlay()
      content.value && content.value.focus()
    }

    function onKeydown (e) {
      if (e.keyCode === keyCodes.esc && !dependent.getOpenDependents().length) {
        if (!props.persistent) {
          isActive.value = false
          const activator = getActivator()
          nextTick(() => activator && activator.focus && activator.focus())
        } else if (!props.noClickAnimation) {
          animateClick()
        }
      }
      emit('keydown', e)
    }

    function getActivator (e) {
      if (activatorRef.value) {
        return activatorRef.value.children.length > 0
          ? activatorRef.value.children[0]
          : activatorRef.value
      }

      if (e) {
        activatedBy.value = e.currentTarget || e.target
      }

      if (activatedBy.value) return activatedBy.value

      if (activatorNode.value) {
        const activator = Array.isArray(activatorNode.value) ? activatorNode.value[0] : activatorNode.value
        const el = activator && activator.elm
        if (el) return el
      }

      return null
    }

    function genActivator () {
      if (!hasActivator.value) return null

      const listeners = props.disabled ? {} : {
        click: e => {
          e.stopPropagation()
          getActivator(e)
          if (!props.disabled) isActive.value = !isActive.value
        }
      }

      if (slots.activator) {
        const activator = slots.activator({ on: listeners })
        activatorNode.value = activator
        return activator
      }

      return h('div', {
        class: {
          'v-dialog__activator': true,
          'v-dialog__activator--disabled': props.disabled
        },
        ref: activatorRef,
        onClick: listeners.click
      }, slots.activator?.())
    }

    watch(isActive, val => {
      dependent.isActive.value = val
      stackIsActive.value = val
      if (val) {
        show()
        hideScroll()
      } else {
        removeOverlay()
      }
    })

    watch(() => props.fullscreen, val => {
      if (!isActive.value) return
      if (val) {
        hideScroll()
        removeOverlay(false)
      } else {
        showScroll()
        genOverlay()
      }
    })

    onMounted(() => {
      if (getSlotType({ $slots: slots }, 'activator', true) === 'v-slot') {
        consoleError(`v-dialog's activator slot must be bound, try '<template #activator="data"><v-btn v-on="data.on>'`, undefined)
      }
    })

    onBeforeUnmount(() => {
      if (animateTimeout !== null) {
        clearTimeout(animateTimeout)
        animateTimeout = null
      }
    })

    return () => {
      const children = []

      const data = {
        class: classes.value,
        ref: dialog,
        style: !props.fullscreen ? {
          maxWidth: props.maxWidth === 'none' ? undefined : convertToUnit(props.maxWidth),
          width: props.width === 'auto' ? undefined : convertToUnit(props.width)
        } : undefined,
        onClick: e => { e.stopPropagation() }
      }

      let dialogVNode = withDirectives(h('div', data, bootable.showLazyContent(slots.default?.())), [
        [ClickOutside, () => { isActive.value = false }],
        [vShow, isActive.value]
      ])
      ;(dialogVNode.dirs[0].args = { closeConditional, include: dependent.getOpenDependentElements })

      if (props.transition) {
        dialogVNode = h('transition', { name: props.transition, origin: props.origin }, { default: () => [dialogVNode] })
      }

      children.push(genActivator())

      children.push(h('div', {
        class: contentClasses.value,
        tabindex: '-1',
        ...getScopeIdAttrs(),
        onKeydown,
        style: { zIndex: activeZIndex.value },
        ref: content
      }, [
        h(ThemeProvider, {
          root: true,
          light: props.light,
          dark: props.dark
        }, { default: () => [dialogVNode] })
      ]))

      return h('div', {
        class: 'v-dialog__container',
        style: { display: (!hasActivator.value || props.fullWidth) ? 'block' : 'inline-block' }
      }, children)
    }
  }
})
