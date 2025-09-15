// Vue
import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'v-card-title',

  props: {
    primaryTitle: Boolean
  },

  setup (props, { slots, attrs }) {
    return () => {
      const data: any = { ...attrs }
      data.class = (`v-card__title ${data.class || ''}`).trim()
      if (props.primaryTitle) data.class += ' v-card__title--primary'
      return h('div', data, slots.default?.())
    }
  }
})
