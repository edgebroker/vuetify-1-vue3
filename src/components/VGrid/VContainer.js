import '@/css/vuetify.css'

import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'v-container',

  props: {
    id: String,
    tag: {
      type: String,
      default: 'div',
    },
  },

  setup (props, { attrs, slots }) {
    return () => {
      const classList = ['container']
      const dataAttrs = {}

      Object.keys(attrs).forEach(key => {
        const value = attrs[key]
        if (key === 'class' || key === 'style') return
        if (key === 'slot') return
        if (key.startsWith('data-')) {
          dataAttrs[key] = value
          return
        }
        if (value || typeof value === 'string') classList.push(key)
      })

      if (attrs.class) classList.push(attrs.class)

      const data = { class: classList, ...dataAttrs }
      if (props.id) data.id = props.id

      return h(props.tag, data, slots.default?.())
    }
  }
})

