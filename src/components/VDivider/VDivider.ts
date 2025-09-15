// Styles
import '@/css/vuetify.css'

// Composables
import useThemeable, { themeProps } from '../../composables/useThemeable'

// Types
import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'v-divider',

  props: {
    ...themeProps,
    inset: Boolean,
    vertical: Boolean
  },

  setup (props, { attrs }) {
    const { themeClasses } = useThemeable(props)

    return () => h('hr', {
      class: {
        'v-divider': true,
        'v-divider--inset': props.inset,
        'v-divider--vertical': props.vertical,
        ...themeClasses.value
      },
      ...attrs
    })
  }
})
