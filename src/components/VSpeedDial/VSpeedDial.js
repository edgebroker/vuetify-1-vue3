import '@/css/vuetify.css'

import useToggleable from '../../composables/useToggleable'
import usePositionable, { positionProps } from '../../composables/usePositionable'
import useTransitionable, { transitionableProps } from '../../composables/useTransitionable'

import ClickOutside from '../../directives/click-outside'

import { defineComponent, h, computed, withDirectives, cloneVNode } from 'vue'

const VSpeedDial = defineComponent({
  name: 'v-speed-dial',

  directives: { ClickOutside },

  props: {
    direction: {
      type: String,
      default: 'top',
      validator: val => ['top', 'right', 'bottom', 'left'].includes(val)
    },
    openOnHover: Boolean,
    transition: {
      type: String,
      default: 'scale-transition'
    },
    value: {
      type: Boolean,
      default: false
    },
    ...positionProps,
    mode: transitionableProps.mode,
    origin: transitionableProps.origin
  },

  setup (props, { slots, attrs, emit }) {
    const { isActive } = useToggleable(props, emit)
    const { positionClasses } = usePositionable(props)
    const { transition, origin, mode } = useTransitionable(props)

    const classes = computed(() => ({
      'v-speed-dial--top': positionClasses.value.top,
      'v-speed-dial--right': positionClasses.value.right,
      'v-speed-dial--bottom': positionClasses.value.bottom,
      'v-speed-dial--left': positionClasses.value.left,
      'v-speed-dial--absolute': positionClasses.value.absolute,
      'v-speed-dial--fixed': positionClasses.value.fixed,
      [`v-speed-dial--direction-${props.direction}`]: true
    }))

    const closeSpeedDial = () => { isActive.value = false }

    function genChildren () {
      if (!isActive.value) return []

      const slotNodes = slots.default?.() || []
      let btnCount = 0

      return slotNodes.map((node, index) => {
        if (!node) return node

        const type = node.type
        if (type && typeof type === 'object' && type.name === 'v-btn') {
          btnCount++
          return h('div', {
            style: {
              transitionDelay: `${btnCount * 0.05}s`
            },
            key: index
          }, [node])
        }

        return cloneVNode(node, { key: index })
      })
    }

    return () => {
      const {
        class: classAttr,
        style,
        onClick: listenerClick,
        onMouseenter: listenerMouseenter,
        onMouseleave: listenerMouseleave,
        ...restAttrs
      } = attrs

      const data = {
        class: ['v-speed-dial', classes.value, classAttr],
        style,
        ...restAttrs,
        onClick: event => {
          listenerClick && listenerClick(event)
          isActive.value = !isActive.value
        }
      }

      if (props.openOnHover) {
        data.onMouseenter = event => {
          listenerMouseenter && listenerMouseenter(event)
          isActive.value = true
        }
        data.onMouseleave = event => {
          listenerMouseleave && listenerMouseleave(event)
          isActive.value = false
        }
      } else {
        if (listenerMouseenter) data.onMouseenter = listenerMouseenter
        if (listenerMouseleave) data.onMouseleave = listenerMouseleave
      }

      const list = h('transition-group', {
        class: 'v-speed-dial__list',
        name: transition.value,
        mode: mode.value,
        origin: origin.value,
        tag: 'div'
      }, genChildren())

      const children = []
      const activator = slots.activator?.()
      if (activator) children.push(...activator)
      children.push(list)

      const speedDial = h('div', data, children)

      return withDirectives(speedDial, [[ClickOutside, closeSpeedDial]])
    }
  }
})

export { VSpeedDial }
export default VSpeedDial
