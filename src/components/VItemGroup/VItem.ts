import { defineComponent, cloneVNode, VNode } from 'vue'

// Composables
import { factory as useGroupableFactory } from '../../composables/useGroupable'

// Utilities
import { consoleWarn } from '../../util/console'

export default defineComponent({
  name: 'v-item',

  props: {
    value: {
      required: false
    }
  },

  emits: ['change'],

  setup (props, { slots, emit }) {
    const useGroupable = useGroupableFactory('itemGroup', 'v-item', 'v-item-group')
    const { isActive, groupClasses, toggle } = useGroupable(props, emit)

    return () => {
      if (!slots.default) {
        consoleWarn('v-item is missing a default scopedSlot')
        return null as any
      }

      let element = slots.default({
        active: isActive.value,
        toggle
      }) as VNode | VNode[]

      if (Array.isArray(element) && element.length === 1) {
        element = element[0]
      }

      if (!element || Array.isArray(element) || typeof element.type === 'symbol') {
        consoleWarn('v-item should only contain a single element')
        return element as any
      }

      return cloneVNode(element as VNode, {
        class: groupClasses.value
      })
    }
  }
})
