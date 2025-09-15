import { cloneVNode, defineComponent, getCurrentInstance } from 'vue'

// Composables
import useDelayable from '../../composables/useDelayable'
import useToggleable from '../../composables/useToggleable'

// Utilities
import { consoleWarn } from '../../util/console'

// Types
import type { VNode } from 'vue'

export default defineComponent({
  name: 'v-hover',

  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    value: {
      type: Boolean,
      default: undefined
    },
    openDelay: {
      type: [Number, String],
      default: 0
    },
    closeDelay: {
      type: [Number, String],
      default: 0
    }
  },

  setup (props, { slots, emit }) {
    const { isActive } = useToggleable(props, emit)
    const { runDelay } = useDelayable(props)
    const vm = getCurrentInstance()

    function onMouseEnter () {
      runDelay('open')
    }

    function onMouseLeave () {
      runDelay('close')
    }

    return () => {
      let slot = slots.default?.({ hover: isActive.value })

      if (!slot && props.value === undefined) {
        consoleWarn('v-hover is missing a default scopedSlot or bound value', vm?.proxy)
        return null as any
      }

      let element: VNode | undefined

      if (Array.isArray(slot)) {
        if (slot.length === 1) element = slot[0]
      } else {
        element = slot
      }

      if (!element || Array.isArray(element)) {
        consoleWarn('v-hover should only contain a single element', vm?.proxy)
        return element as any
      }

      if (!props.disabled) {
        element = cloneVNode(element, {
          onMouseenter: onMouseEnter,
          onMouseleave: onMouseLeave
        })
      }

      return element
    }
  }
})
