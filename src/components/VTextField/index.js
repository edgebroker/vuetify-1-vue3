import { defineComponent, getCurrentInstance, h } from 'vue'

import VTextField from './VTextField'
import VTextarea from '../VTextarea/VTextarea'
import { deprecate } from '../../util/console'

export const VTextFieldWrapper = defineComponent({
  name: 'v-text-field',

  inheritAttrs: false,

  props: {
    textarea: Boolean,
    multiLine: Boolean
  },

  setup (props, { attrs, slots, expose }) {
    expose()

    const instance = getCurrentInstance()
    const parent = instance?.proxy?.$parent
    const vm = instance?.type

    return () => {
      const children = slots.default ? slots.default() : []
      const forwarded = { ...attrs }

      if (props.textarea) {
        deprecate('<v-text-field textarea>', '<v-textarea outline>', vm, parent)
      }

      if (props.multiLine) {
        deprecate('<v-text-field multi-line>', '<v-textarea>', vm, parent)
      }

      if (props.textarea || props.multiLine) {
        forwarded.outline = props.textarea || forwarded.outline
        return h(VTextarea, forwarded, children)
      }

      return h(VTextField, forwarded, children)
    }
  }
})

export { VTextFieldWrapper as VTextField }
export default VTextFieldWrapper
