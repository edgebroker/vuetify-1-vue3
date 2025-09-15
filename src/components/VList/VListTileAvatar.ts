import { defineComponent, h } from 'vue'

import VAvatar from '../VAvatar'

export default defineComponent({
  name: 'v-list-tile-avatar',

  props: {
    color: String,
    size: {
      type: [Number, String],
      default: 40
    },
    tile: Boolean
  },

  setup (props, { slots, attrs }) {
    return () => {
      const { class: className, ...rest } = attrs as any
      const avatar = h(VAvatar, { color: props.color, size: props.size, tile: props.tile }, slots.default?.())
      return h('div', { class: ['v-list__tile__avatar', className], ...rest }, [avatar])
    }
  }
})

