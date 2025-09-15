import VBtn from '../VBtn'
import VIcon from '../VIcon'

// Types
import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'v-toolbar-side-icon',

  setup (_, { attrs, slots }) {
    return () => {
      const { class: classAttr, ...restAttrs } = attrs
      const children = slots.default?.() || [h(VIcon, '$vuetify.icons.menu')]

      return h(VBtn, {
        class: [classAttr, 'v-toolbar__side-icon'],
        ...restAttrs,
        icon: true
      }, children)
    }
  }
})
