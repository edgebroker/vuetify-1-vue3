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
      const attributes = attrs as Record<string, unknown>
      const classList: any[] = ['container']
      const dataAttrs: Record<string, unknown> = {}

      Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'class' || key === 'style' || key === 'slot') return
        if (key.startsWith('data-')) {
          dataAttrs[key] = value
          return
        }
        const typedValue = value as any
        if (typedValue || typeof typedValue === 'string') classList.push(key)
      })

      if (attributes.class != null) classList.push(attributes.class)

      const data: Record<string, unknown> = { class: classList, ...dataAttrs }
      if (attributes.style != null) data.style = attributes.style
      if (props.id) data.id = props.id

      return h(props.tag, data, slots.default?.())
    }
  }
})

