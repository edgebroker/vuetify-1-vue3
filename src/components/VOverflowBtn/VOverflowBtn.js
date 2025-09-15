// Styles
import "@/css/vuetify.css"

// Extensions
import VSelect from '../VSelect/VSelect'
import VAutocomplete from '../VAutocomplete'
import VTextField from '../VTextField/VTextField'

import VBtn from '../VBtn'

import { consoleWarn } from '../../util/console'

import { defineComponent, getCurrentInstance, computed } from 'vue'

export default defineComponent({
  name: 'v-overflow-btn',

  extends: VAutocomplete,

  props: {
    segmented: Boolean,
    editable: Boolean,
    transition: VSelect.options.props.transition
  },

  setup (props) {
    const vm = getCurrentInstance()
    const proxy = vm?.proxy

    const classes = computed(() => Object.assign({},
      proxy ? VAutocomplete.options.computed.classes.call(proxy) : {},
      {
        'v-overflow-btn': true,
        'v-overflow-btn--segmented': props.segmented,
        'v-overflow-btn--editable': props.editable
      }
    ))

    const isAnyValueAllowed = computed(() => {
      if (props.editable) return true
      return proxy ? VAutocomplete.options.computed.isAnyValueAllowed.call(proxy) : false
    })

    const isSingle = computed(() => true)

    const computedItems = computed(() => {
      if (!proxy) return []
      return props.segmented ? proxy.allItems : proxy.filteredItems
    })

    const menuProps = computed(() => {
      const propsValue = proxy ? { ...VAutocomplete.options.computed.$_menuProps.call(proxy) } : {}
      propsValue.transition = propsValue.transition || 'v-menu-transition'
      return propsValue
    })

    function genSelections () {
      if (!proxy) return []
      return props.editable
        ? VAutocomplete.options.methods.genSelections.call(proxy)
        : VSelect.options.methods.genSelections.call(proxy)
    }

    function genCommaSelection (item, index, last) {
      if (!proxy) return null
      return props.segmented
        ? genSegmentedBtn(item)
        : VSelect.options.methods.genCommaSelection.call(proxy, item, index, last)
    }

    function genInput () {
      if (!proxy) return null
      const input = VTextField.options.methods.genInput.call(proxy)

      input.data.domProps.value = props.editable ? proxy.internalSearch : ''
      input.data.attrs.readonly = !isAnyValueAllowed.value

      return input
    }

    function genLabel () {
      if (!proxy) return null
      if (props.editable && proxy.isFocused) return null

      const label = VTextField.options.methods.genLabel.call(proxy)
      if (!label) return label

      label.data.style = {}

      return label
    }

    function genSegmentedBtn (item) {
      if (!proxy) return null
      const items = computedItems.value || []
      const itemValue = proxy.getValue(item)
      const itemObj = items.find(i => proxy.getValue(i) === itemValue) || item

      if (!itemObj.text || !itemObj.callback) {
        consoleWarn("When using 'segmented' prop without a selection slot, items must contain both a text and callback property", proxy)
        return null
      }

      return proxy.$createElement(VBtn, {
        props: { flat: true },
        on: {
          click (e) {
            e.stopPropagation()
            itemObj.callback(e)
          }
        }
      }, [itemObj.text])
    }

    return {
      classes,
      isAnyValueAllowed,
      isSingle,
      computedItems,
      $_menuProps: menuProps,
      genSelections,
      genCommaSelection,
      genInput,
      genLabel,
      genSegmentedBtn
    }
  }
})
