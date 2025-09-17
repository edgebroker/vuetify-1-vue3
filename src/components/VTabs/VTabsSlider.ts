import '@/css/vuetify.css'

// Composables
import useColorable, { colorProps } from '../../composables/useColorable'

// Types
import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'v-tabs-slider',

  props: {
    ...colorProps
  },

  setup (props) {
    const { setBackgroundColor } = useColorable(props)

    return () => h('div', setBackgroundColor(props.color || 'accent', {
      staticClass: 'v-tabs__slider'
    }))
  }
})
