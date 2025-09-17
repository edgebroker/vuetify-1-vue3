import { defineComponent, h } from 'vue'

import VToolbar from './VToolbar'
import VToolbarSideIcon from './VToolbarSideIcon'

const VToolbarTitle = defineComponent({
  name: 'VToolbarTitle',

  setup (_, { attrs, slots }) {
    return () => {
      const { class: className, ...restAttrs } = attrs as any
      return h('div', {
        ...restAttrs,
        class: ['v-toolbar__title', className]
      }, slots.default?.())
    }
  }
})

const VToolbarItems = defineComponent({
  name: 'VToolbarItems',

  setup (_, { attrs, slots }) {
    return () => {
      const { class: className, ...restAttrs } = attrs as any
      return h('div', {
        ...restAttrs,
        class: ['v-toolbar__items', className]
      }, slots.default?.())
    }
  }
})

export { VToolbar, VToolbarSideIcon, VToolbarTitle, VToolbarItems }

export default {
  $_vuetify_subcomponents: {
    VToolbar,
    VToolbarItems,
    VToolbarTitle,
    VToolbarSideIcon
  }
}
