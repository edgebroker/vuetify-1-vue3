import "@/css/vuetify.css"

import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'v-layout',

  props: {
    id: String,
    tag: {
      type: String,
      default: 'div'
    }
  },

  setup (props, { attrs, slots }) {
    return () => {
      const dataAttrs = {}
      const classes = ['layout']

      Object.keys(attrs).forEach(key => {
        const value = attrs[key]
        if (key === 'slot') return
        if (key.startsWith('data-')) {
          dataAttrs[key] = value
        } else if (value || typeof value === 'string') {
          classes.push(key)
        }
      })

      return h(props.tag, {
        class: classes.join(' '),
        id: props.id,
        ...dataAttrs
      }, slots.default?.())
    }
  }
})
