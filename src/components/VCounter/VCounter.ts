// Styles
import '@/css/vuetify.css'

// Composables
import useThemeable, { themeProps } from '../../composables/useThemeable'

// Types
import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'v-counter',

  props: {
    ...themeProps,
    value: {
      type: [Number, String],
      default: ''
    },
    max: [Number, String]
  },

  setup (props) {
    const { themeClasses } = useThemeable(props)

    return () => {
      const max = parseInt(props.max as any, 10)
      const value = parseInt(props.value as any, 10)
      const content = max ? `${value} / ${max}` : String(props.value)
      const isGreater = max && (value > max)

      return h('div', {
        class: ['v-counter', { 'error--text': isGreater }, themeClasses.value]
      }, content)
    }
  }
})
