import { defineComponent, h } from 'vue'
import VContainer from './VContainer'
import VContent from './VContent'
import VFlex from './VFlex'
import VLayout from './VLayout'

const VSpacer = defineComponent({
  name: 'v-spacer',
  inheritAttrs: false,
  setup (_props, { attrs, slots }) {
    return () => {
      const { class: className, style, ...restAttrs } = attrs

      return h('div', {
        class: ['spacer', className],
        style,
        ...restAttrs
      }, slots.default?.())
    }
  }
})

export {
  VContainer,
  VContent,
  VFlex,
  VLayout,
  VSpacer
}

export default {
  $_vuetify_subcomponents: {
    VContainer,
    VContent,
    VFlex,
    VLayout,
    VSpacer
  }
}
