import { defineComponent, h, Comment } from 'vue'

export default defineComponent({
  name: 'v-list-tile-action',

  setup (_, { slots, attrs }) {
    return () => {
      const { class: className, ...rest } = attrs as any
      const children = slots.default?.() || []
      const filtered = children.filter(v => v.type !== Comment && !(typeof v.children === 'string' && v.children.trim() === ''))
      const classes = ['v-list__tile__action', className]
      if (filtered.length > 1) classes.push('v-list__tile__action--stack')
      return h('div', { class: classes, ...rest }, children)
    }
  }
})
