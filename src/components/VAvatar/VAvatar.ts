import '@/css/vuetify.css'

// Composables
import useColorable, { colorProps } from '../../composables/useColorable'

// Utilities
import { convertToUnit } from '../../util/helpers'

// Types
import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'v-avatar',

  props: {
    ...colorProps,
    size: {
      type: [Number, String],
      default: 48
    },
    tile: Boolean
  },

  setup (props, { slots }) {
    const { setBackgroundColor } = useColorable(props)

    return () => {
      const size = convertToUnit(props.size)
      const data = {
        class: ['v-avatar', { 'v-avatar--tile': props.tile }],
        style: {
          height: size,
          width: size
        }
      }

      return h('div', setBackgroundColor(props.color, data), slots.default?.())
    }
  }
})
