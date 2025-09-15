// Styles
import "@/css/vuetify.css"

import { defineComponent, h } from 'vue'

// Composables
import useThemeable, { themeProps } from '../../composables/useThemeable'

export default defineComponent({
  name: 'v-subheader',

  props: {
    inset: Boolean,
    ...themeProps
  },

  setup (props, { slots, attrs }) {
    const { themeClasses } = useThemeable(props)

    return () => h('div', {
      class: {
        'v-subheader': true,
        'v-subheader--inset': props.inset,
        ...themeClasses.value
      },
      ...attrs
    }, slots.default && slots.default())
  }
})
