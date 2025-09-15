// Styles
import '@/css/vuetify.css'

// Composables
import useBootable from '../../composables/useBootable'
import useColorable, { colorProps } from '../../composables/useColorable'
import useDelayable from '../../composables/useDelayable'
import useDependent from '../../composables/useDependent'
import useDetachable, { detachableProps } from '../../composables/useDetachable'
import useMenuable, { menuableProps } from '../../composables/useMenuable'
import useToggleable from '../../composables/useToggleable'
import { positionPropsFactory } from '../../composables/usePositionable'

// Helpers
import { convertToUnit, getSlotType } from '../../util/helpers'
import { consoleError } from '../../util/console'

// Types
import { defineComponent, h, ref, computed, watch, getCurrentInstance, onMounted, nextTick } from 'vue'

export default defineComponent({
  name: 'v-tooltip',

  props: {
    closeDelay: {
      type: [Number, String],
      default: 200
    },
    debounce: {
      type: [Number, String],
      default: 0
    },
    disabled: Boolean,
    fixed: {
      type: Boolean,
      default: true
    },
    openDelay: {
      type: [Number, String],
      default: 200
    },
    tag: {
      type: String,
      default: 'span'
    },
    transition: String,
    zIndex: {
      default: null
    },
    lazy: Boolean,
    value: null,
    ...colorProps,
    ...detachableProps,
    ...menuableProps,
    ...positionPropsFactory(['top', 'bottom', 'left', 'right'])
  },

  setup (props, { slots, emit, attrs }) {
    const vm = getCurrentInstance()
    const activatorRef = ref<HTMLElement | null>(null)
    const activatorNode = ref<any>(null)
    const contentRef = ref<HTMLElement | null>(null)
    const activatedBy = ref<HTMLElement | null>(null)

    const { setBackgroundColor } = useColorable(props)
    const { runDelay } = useDelayable(props)
    const { isActive } = useToggleable(props, emit)
    const dependent = useDependent()
    dependent.closeDependents.value = false
    const menuable = useMenuable(props, { activator: activatorRef, content: contentRef, isActive })
    const detachable = useDetachable(props, { activator: activatorNode, content: contentRef, isActive })
    const bootable = useBootable(props, { isActive })

    const isAttached = computed(() => props.attach !== false)

    const classes = computed(() => ({
      'v-tooltip--top': props.top,
      'v-tooltip--right': props.right,
      'v-tooltip--bottom': props.bottom,
      'v-tooltip--left': props.left
    }))

    const computedTransition = computed(() => {
      if (props.transition) return props.transition
      if (props.top) return 'slide-y-reverse-transition'
      if (props.right) return 'slide-x-transition'
      if (props.bottom) return 'slide-y-transition'
      if (props.left) return 'slide-x-reverse-transition'
      return ''
    })

    const calculatedLeft = computed(() => {
      const { activator, content } = menuable.dimensions
      const unknown = !props.bottom && !props.left && !props.top && !props.right
      const activatorLeft = isAttached.value ? activator.offsetLeft : activator.left
      let left = 0

      if (props.top || props.bottom || unknown) {
        left = activatorLeft + (activator.width / 2) - (content.width / 2)
      } else if (props.left || props.right) {
        left = activatorLeft + (props.right ? activator.width : -content.width) + (props.right ? 10 : -10)
      }

      if (props.nudgeLeft) left -= parseInt(props.nudgeLeft as any)
      if (props.nudgeRight) left += parseInt(props.nudgeRight as any)

      return `${menuable.calcXOverflow(left, menuable.dimensions.content.width)}px`
    })

    const calculatedTop = computed(() => {
      const { activator, content } = menuable.dimensions
      const activatorTop = isAttached.value ? activator.offsetTop : activator.top
      let top = 0

      if (props.top || props.bottom) {
        top = activatorTop + (props.bottom ? activator.height : -content.height) + (props.bottom ? 10 : -10)
      } else if (props.left || props.right) {
        top = activatorTop + (activator.height / 2) - (content.height / 2)
      }

      if (props.nudgeTop) top -= parseInt(props.nudgeTop as any)
      if (props.nudgeBottom) top += parseInt(props.nudgeBottom as any)

      return `${menuable.calcYOverflow(top + menuable.pageYOffset.value)}px`
    })

    const styles = computed(() => ({
      left: calculatedLeft.value,
      maxWidth: convertToUnit(props.maxWidth),
      minWidth: convertToUnit(props.minWidth),
      opacity: isActive.value ? 0.9 : 0,
      top: calculatedTop.value,
      zIndex: props.zIndex != null ? props.zIndex : 0
    }))

    function updateDimensions () {
      menuable.updateDimensions()
    }

    function activate () {
      updateDimensions()
      requestAnimationFrame(() => {
        menuable.isContentActive.value = true
      })
    }

    function deactivate () {
      menuable.isContentActive.value = false
    }

    function getActivator (e?: Event) {
      if (props.activator) {
        return typeof props.activator === 'string'
          ? (typeof document !== 'undefined' ? document.querySelector(props.activator) : null)
          : props.activator
      }

      if (activatorRef.value) {
        return activatorRef.value.children.length > 0
          ? activatorRef.value.children[0] as HTMLElement
          : activatorRef.value
      }

      if (e && e.currentTarget) {
        activatedBy.value = e.currentTarget as HTMLElement
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

    function genActivator () {
      const listeners = props.disabled ? {} : {
        mouseenter: (e: Event) => {
          getActivator(e)
          runDelay('open', () => { isActive.value = true })
        },
        mouseleave: (e: Event) => {
          getActivator(e)
          runDelay('close', () => { isActive.value = false })
        }
      }

      const slotType = vm && vm.proxy ? getSlotType(vm.proxy, 'activator') : null
      if (slotType === 'scoped' && slots.activator) {
        const activator = slots.activator({ on: listeners })
        activatorNode.value = activator
        return activator
      }

      if (slots.activator) {
        return h('span', {
          ref: activatorRef,
          on: listeners
        }, slots.activator())
      }

      return null
    }

    watch(isActive, val => {
      dependent.isActive.value = val
      val ? activate() : deactivate()
    })

    onMounted(() => {
      nextTick(() => {
        if (isActive.value) activate()
      })

      if (vm && vm.proxy && getSlotType(vm.proxy, 'activator', true) === 'v-slot') {
        consoleError(`v-tooltip's activator slot must be bound, try '<template #activator="data"><v-btn v-on="data.on">'`, vm.proxy)
      }
    })

    return () => {
      const tooltip = h('div', setBackgroundColor(props.color, {
        staticClass: 'v-tooltip__content',
        class: {
          [props.contentClass.trim()]: true,
          'menuable__content__active': isActive.value,
          'v-tooltip__content--fixed': menuable.activatorFixed.value
        },
        style: styles.value,
        attrs: detachable.getScopeIdAttrs(),
        directives: [{
          name: 'show',
          value: menuable.isContentActive.value
        }],
        ref: contentRef
      }), bootable.showLazyContent(slots.default?.()))

      const { class: classAttr, style: styleAttr, ...restAttrs } = attrs

      return h(props.tag, {
        class: ['v-tooltip', classes.value, classAttr],
        style: styleAttr,
        ...restAttrs
      }, [
        h('transition', { props: { name: computedTransition.value } }, [tooltip]),
        genActivator()
      ])
    }
  }
})
