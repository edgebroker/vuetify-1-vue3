// Styles
import '@/css/vuetify.css'

// Composables
import useColorable from '../../composables/useColorable'
import useThemeable, { themeProps } from '../../composables/useThemeable'

// Utilities
import { convertToUnit } from '../../util/helpers'

// Types
import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'v-label',

  props: {
    ...themeProps,
    absolute: Boolean,
    color: {
      type: String,
      default: 'primary'
    },
    disabled: Boolean,
    focused: Boolean,
    for: String,
    left: {
      type: [Number, String],
      default: 0
    },
    right: {
      type: [Number, String],
      default: 'auto'
    },
    value: Boolean
  },

  setup (props, { slots, attrs }) {
    const { setTextColor } = useColorable(props)
    const { themeClasses } = useThemeable(props)

    return () => {
      const data = {
        class: ['v-label', {
          'v-label--active': props.value,
          'v-label--is-disabled': props.disabled,
          ...themeClasses.value
        }],
        style: {
          left: convertToUnit(props.left),
          right: convertToUnit(props.right),
          position: props.absolute ? 'absolute' : 'relative'
        },
        for: props.for,
        'aria-hidden': !props.for,
        ...attrs
      }

      return h('label', setTextColor(props.focused && props.color, data), slots.default?.())
    }
  }
})
