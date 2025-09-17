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

    const baseOptions = VAutocomplete.options || {}
    const baseComputed = baseOptions.computed || {}
    const baseMethods = baseOptions.methods || {}
    const selectMethods = (VSelect.options && VSelect.options.methods) || {}
    const textFieldMethods = (VTextField.options && VTextField.options.methods) || {}

    const getAutocompleteClasses = proxy && typeof baseComputed.classes === 'function'
      ? baseComputed.classes.bind(proxy)
      : undefined
    const getIsAnyValueAllowed = proxy && typeof baseComputed.isAnyValueAllowed === 'function'
      ? baseComputed.isAnyValueAllowed.bind(proxy)
      : undefined
    const getMenuProps = proxy && typeof baseComputed.$_menuProps === 'function'
      ? baseComputed.$_menuProps.bind(proxy)
      : undefined
    const genAutocompleteSelections = proxy && typeof baseMethods.genSelections === 'function'
      ? baseMethods.genSelections.bind(proxy)
      : undefined
    const genSelectSelections = proxy && typeof selectMethods.genSelections === 'function'
      ? selectMethods.genSelections.bind(proxy)
      : undefined
    const genSelectCommaSelection = proxy && typeof selectMethods.genCommaSelection === 'function'
      ? selectMethods.genCommaSelection.bind(proxy)
      : undefined
    const genTextFieldInput = proxy && typeof textFieldMethods.genInput === 'function'
      ? textFieldMethods.genInput.bind(proxy)
      : undefined
    const genTextFieldLabel = proxy && typeof textFieldMethods.genLabel === 'function'
      ? textFieldMethods.genLabel.bind(proxy)
      : undefined

    const classes = computed(() => Object.assign({},
      getAutocompleteClasses ? getAutocompleteClasses() : {},
      {
        'v-overflow-btn': true,
        'v-overflow-btn--segmented': props.segmented,
        'v-overflow-btn--editable': props.editable
      }
    ))

    const isAnyValueAllowed = computed(() => {
      if (props.editable) return true
      return getIsAnyValueAllowed ? Boolean(getIsAnyValueAllowed()) : false
    })

    const isSingle = computed(() => true)

    const computedItems = computed(() => {
      if (!proxy) return []
      return props.segmented ? proxy.allItems : proxy.filteredItems
    })

    const menuProps = computed(() => {
      const propsValue = getMenuProps ? { ...getMenuProps() } : {}
      propsValue.transition = propsValue.transition || 'v-menu-transition'
      return propsValue
    })

    function genSelections () {
      if (!proxy) return []
      return props.editable
        ? (genAutocompleteSelections ? genAutocompleteSelections() : [])
        : (genSelectSelections ? genSelectSelections() : [])
    }

    function genCommaSelection (item, index, last) {
      if (!proxy) return null
      return props.segmented
        ? genSegmentedBtn(item)
        : genSelectCommaSelection
          ? genSelectCommaSelection(item, index, last)
          : null
    }

    function genInput () {
      if (!proxy) return null
      const input = genTextFieldInput ? genTextFieldInput() : null
      if (!input) return input

      input.data.domProps.value = props.editable ? proxy.internalSearch : ''
      input.data.attrs.readonly = !isAnyValueAllowed.value

      return input
    }

    function genLabel () {
      if (!proxy) return null
      if (props.editable && proxy.isFocused) return null

      const label = genTextFieldLabel ? genTextFieldLabel() : null
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
