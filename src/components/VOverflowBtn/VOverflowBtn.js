// Styles
import "@/css/vuetify.css"

// Extensions
import VAutocomplete from '../VAutocomplete'
import { useSelectController } from '../VSelect/VSelect'
import { useTextFieldController } from '../VTextField/VTextField'

import VBtn from '../VBtn'

import { consoleWarn } from '../../util/console'

import { defineComponent, getCurrentInstance, computed } from 'vue'

export default defineComponent({
  name: 'v-overflow-btn',

  extends: VAutocomplete,

  props: {
    segmented: Boolean,
    editable: Boolean,
    transition: {
      type: [String, Boolean],
      default: undefined
    }
  },

  setup (props) {
    const vm = getCurrentInstance()
    const proxy = vm?.proxy

    const {
      classes: baseClasses,
      isAnyValueAllowed: baseIsAnyValueAllowed,
      menuProps: baseMenuProps,
      genSelections: baseGenSelections,
      genCommaSelection: baseGenCommaSelection
    } = useSelectController()
    const { genInput: baseGenInput, genLabel: baseGenLabel } = useTextFieldController()

    const classes = computed(() => Object.assign({},
      baseClasses ? baseClasses.value : {},
      {
        'v-overflow-btn': true,
        'v-overflow-btn--segmented': props.segmented,
        'v-overflow-btn--editable': props.editable
      }
    ))

    const isAnyValueAllowed = computed(() => {
      if (props.editable) return true
      return baseIsAnyValueAllowed ? Boolean(baseIsAnyValueAllowed.value) : false
    })

    const isSingle = computed(() => true)

    const computedItems = computed(() => {
      if (!proxy) return []
      return props.segmented ? proxy.allItems : proxy.filteredItems
    })

    const menuProps = computed(() => {
      const propsValue = baseMenuProps ? { ...(baseMenuProps.value || {}) } : {}
      propsValue.transition = propsValue.transition || 'v-menu-transition'
      return propsValue
    })

    function genSelections () {
      if (!proxy) return []
      const generate = baseGenSelections
      return generate ? generate() : []
    }

    function genCommaSelection (item, index, last) {
      if (!proxy) return null
      return props.segmented
        ? genSegmentedBtn(item)
        : baseGenCommaSelection
          ? baseGenCommaSelection(item, index, last)
          : null
    }

    function genInput () {
      if (!proxy) return null
      const input = baseGenInput ? baseGenInput() : null
      if (!input) return input

      input.data.domProps.value = props.editable ? proxy.internalSearch : ''
      input.data.attrs.readonly = !isAnyValueAllowed.value

      return input
    }

    function genLabel () {
      if (!proxy) return null
      if (props.editable && proxy.isFocused) return null

      const label = baseGenLabel ? baseGenLabel() : null
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
