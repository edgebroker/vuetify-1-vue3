// Styles
import '@/css/vuetify.css'

// Composables
import useThemeable, { themeProps } from '../../composables/useThemeable'

// Types
import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'v-subheader',

  props: {
    ...themeProps,
    inset: Boolean
  },

  setup (props, { attrs, slots }) {
    const { themeClasses } = useThemeable(props)

    return () => h('div', {
      class: ['v-subheader', { 'v-subheader--inset': props.inset }, themeClasses.value],
      ...attrs
    }, slots.default?.())
  }
})
