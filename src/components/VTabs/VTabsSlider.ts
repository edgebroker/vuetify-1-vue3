import useColorable from '../../composables/useColorable'
import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'v-tabs-slider',

  props: {
    color: String
  },

  setup (props: { color?: string }) {
    const { setBackgroundColor } = useColorable(props)

    return () => h('div', setBackgroundColor(props.color || 'accent', {
      staticClass: 'v-tabs__slider'
    }))
  }
})
