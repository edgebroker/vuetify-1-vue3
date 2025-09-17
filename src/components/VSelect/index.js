import { defineComponent, getCurrentInstance, h } from 'vue'

import VSelect from './VSelect'
import VAutocomplete from '../VAutocomplete'
import VCombobox from '../VCombobox'
import VOverflowBtn from '../VOverflowBtn'
import { deprecate } from '../../util/console'

const componentName = 'v-select'

export const VSelectWrapper = defineComponent({
  name: componentName,

  inheritAttrs: false,

  props: {
    autocomplete: Boolean,
    combobox: Boolean,
    multiple: Boolean,
    tags: Boolean,
    editable: Boolean,
    overflow: Boolean,
    segmented: Boolean
  },

  setup (props, { attrs, slots, expose }) {
    expose()

    const instance = getCurrentInstance()
    const vm = instance?.type
    const parent = instance?.proxy?.$parent

    return () => {
      const children = slots.default ? slots.default() : []
      const forwarded = { ...attrs }

      if (props.autocomplete) {
        deprecate('<v-select autocomplete>', '<v-autocomplete>', vm, parent)
      }
      if (props.combobox) {
        deprecate('<v-select combobox>', '<v-combobox>', vm, parent)
      }
      if (props.tags) {
        deprecate('<v-select tags>', '<v-combobox multiple>', vm, parent)
      }
      if (props.overflow) {
        deprecate('<v-select overflow>', '<v-overflow-btn>', vm, parent)
      }
      if (props.segmented) {
        deprecate('<v-select segmented>', '<v-overflow-btn segmented>', vm, parent)
      }
      if (props.editable) {
        deprecate('<v-select editable>', '<v-overflow-btn editable>', vm, parent)
      }

      if (props.combobox || props.tags) {
        return h(VCombobox, { ...forwarded, multiple: props.tags }, children)
      }

      if (props.autocomplete) {
        return h(VAutocomplete, { ...forwarded, multiple: props.multiple }, children)
      }

      if (props.overflow || props.segmented || props.editable) {
        return h(VOverflowBtn, {
          ...forwarded,
          segmented: props.segmented,
          editable: props.editable
        }, children)
      }

      return h(VSelect, { ...forwarded, multiple: props.multiple }, children)
    }
  }
})

export { VSelectWrapper as VSelect }
export default VSelectWrapper
