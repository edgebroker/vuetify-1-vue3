// Extensions
import VWindowItem from '../VWindow/VWindowItem'

// Utilities
import { deprecate } from '../../util/console'

// Types
import { defineComponent, h, getCurrentInstance } from 'vue'

export default defineComponent({
  name: 'v-tab-item',
  extends: VWindowItem,

  props: {
    id: String,
  },

  setup (props) {
    const vm = getCurrentInstance()

    return () => {
      const proxy = vm?.proxy ?? {}
      const render = VWindowItem.options.render.call(proxy, h)

      if (props.id) {
        deprecate('id', 'value', proxy)
        render.data = render.data || {}
        render.data.domProps = render.data.domProps || {}
        render.data.domProps.id = props.id
      }

      return render
    }
  },
})
