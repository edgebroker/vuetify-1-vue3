import { defineComponent, h, mergeProps } from 'vue'

export default defineComponent({
  name: 'v-table-overflow',

  setup (_, { attrs, slots }) {
    return () => h('div', mergeProps({ class: 'v-table__overflow' }, attrs), slots.default?.())
  }
})
