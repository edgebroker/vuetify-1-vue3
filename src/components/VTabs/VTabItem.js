// Components
import VWindowItem from '../VWindow/VWindowItem'

// Utilities
import { deprecate } from '../../util/console'

// Types
import { defineComponent, h, mergeProps, getCurrentInstance } from 'vue'

const windowItemProps = {
  reverseTransition: {
    type: [Boolean, String],
    default: undefined,
  },
  transition: {
    type: [Boolean, String],
    default: undefined,
  },
  value: {
    required: false,
  },
  lazy: Boolean,
}

export default defineComponent({
  name: 'v-tab-item',

  inheritAttrs: false,

  props: {
    ...windowItemProps,
    id: String,
  },

  setup (props, { attrs, slots }) {
    const vm = getCurrentInstance()

    return () => {
      const forwardedAttrs = { ...attrs }

      if (props.id) {
        deprecate('id', 'value', vm?.proxy)
        forwardedAttrs.id = props.id
      }

      return h(
        VWindowItem,
        mergeProps({
          reverseTransition: props.reverseTransition,
          transition: props.transition,
          value: props.value,
          lazy: props.lazy,
        }, forwardedAttrs),
        slots,
      )
    }
  },
})
