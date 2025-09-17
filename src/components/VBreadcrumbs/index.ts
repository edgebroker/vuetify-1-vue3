import { defineComponent, h } from 'vue'

import VBreadcrumbs from './VBreadcrumbs'
import VBreadcrumbsItem from './VBreadcrumbsItem'

const VBreadcrumbsDivider = defineComponent({
  name: 'VBreadcrumbsDivider',

  setup (_, { attrs, slots }) {
    return () => {
      const { class: className, ...restAttrs } = attrs as any
      return h('li', {
        ...restAttrs,
        class: ['v-breadcrumbs__divider', className]
      }, slots.default?.())
    }
  }
})

export { VBreadcrumbs, VBreadcrumbsItem, VBreadcrumbsDivider }

export default {
  $_vuetify_subcomponents: {
    VBreadcrumbs,
    VBreadcrumbsItem,
    VBreadcrumbsDivider
  }
}
