// Styles
import '@/css/vuetify.css'

// Extensions
import VAutocomplete from '../VAutocomplete/VAutocomplete'
import { useSelectController } from '../VSelect/VSelect'

// Utils
import { keyCodes } from '../../util/helpers'

// Types
import { defineComponent, ref, computed, getCurrentInstance } from 'vue'

export default defineComponent({
  name: 'v-combobox',

  extends: VAutocomplete,

  props: {
    delimiters: {
      type: Array,
      default: () => ([])
    },
    returnObject: {
      type: Boolean,
      default: true
    }
  },

  setup (props) {
    const vm = getCurrentInstance().proxy
    const {
      hasSlot: baseHasSlot,
      genChipSelection: baseGenChipSelection,
      onChipInput: baseOnChipInput,
      onEnterDown: baseOnEnterDown,
      onKeyDown: baseOnKeyDown,
      onTabDown: baseOnTabDown,
      selectItem: baseSelectItem,
      setValue: baseSetValue
    } = useSelectController()
    const editingIndex = ref(-1)

    const counterValue = computed(() => {
      return vm.multiple
        ? vm.selectedItems.length
        : (vm.internalSearch || '').toString().length
    })

    const hasSlot = computed(() => {
      return Boolean((baseHasSlot && baseHasSlot.value) || vm.multiple)
    })

    const isAnyValueAllowed = computed(() => true)

    const menuCanShow = computed(() => {
      if (!vm.isFocused) return false
      return vm.hasDisplayedItems || (!!vm.$slots['no-data'] && !vm.hideNoData)
    })

    function onFilteredItemsChanged () {
      // no-op
    }

    function onInternalSearchChanged (val) {
      if (
        val &&
        vm.multiple &&
        props.delimiters.length
      ) {
        const delimiter = props.delimiters.find(d => val.endsWith(d))
        if (delimiter != null) {
          vm.internalSearch = val.slice(0, val.length - delimiter.length)
          updateTags()
        }
      }

      vm.updateMenuDimensions()
    }

    function genChipSelection (item, index) {
      const chip = baseGenChipSelection ? baseGenChipSelection(item, index) : undefined

      if (chip && vm.multiple && chip.componentOptions && chip.componentOptions.listeners) {
        chip.componentOptions.listeners.dblclick = () => {
          editingIndex.value = index
          vm.internalSearch = vm.getText(item)
          vm.selectedIndex = -1
        }
      }

      return chip || null
    }

    function onChipInput (item) {
      baseOnChipInput && baseOnChipInput(item)
      editingIndex.value = -1
    }

    function onEnterDown (e) {
      e.preventDefault()
      baseOnEnterDown && baseOnEnterDown()
      if (vm.getMenuIndex() > -1) return
      updateSelf()
    }

    function onKeyDown (e) {
      const keyCode = e.keyCode
      baseOnKeyDown && baseOnKeyDown(e)
      if (vm.multiple &&
        keyCode === keyCodes.left &&
        vm.$refs.input.selectionStart === 0
      ) {
        updateSelf()
      }
      vm.changeSelectedIndex(keyCode)
    }

    function onTabDown (e) {
      if (vm.multiple &&
        vm.internalSearch &&
        vm.getMenuIndex() === -1
      ) {
        e.preventDefault()
        e.stopPropagation()
        return updateTags()
      }
      baseOnTabDown && baseOnTabDown(e)
    }

    function selectItem (item) {
      if (editingIndex.value > -1) {
        updateEditing()
      } else {
        baseSelectItem && baseSelectItem(item)
      }
    }

    function setSelectedItems () {
      if (vm.internalValue == null ||
        vm.internalValue === ''
      ) {
        vm.selectedItems = []
      } else {
        vm.selectedItems = vm.multiple ? vm.internalValue : [vm.internalValue]
      }
    }

    function setValue (value = vm.internalSearch) {
      baseSetValue && baseSetValue(value)
    }

    function updateEditing () {
      const value = vm.internalValue.slice()
      value[editingIndex.value] = vm.internalSearch
      setValue(value)
      editingIndex.value = -1
    }

    function updateCombobox () {
      const isUsingSlot = Boolean(vm.$scopedSlots.selection) || vm.hasChips
      if (isUsingSlot && !vm.searchIsDirty) return
      if (vm.internalSearch !== vm.getText(vm.internalValue)) setValue()
      if (isUsingSlot) vm.internalSearch = undefined
    }

    function updateSelf () {
      vm.multiple ? updateTags() : updateCombobox()
    }

    function updateTags () {
      const menuIndex = vm.getMenuIndex()
      if (menuIndex < 0 && !vm.searchIsDirty) return
      if (editingIndex.value > -1) {
        return updateEditing()
      }
      const index = vm.selectedItems.indexOf(vm.internalSearch)
      if (index > -1) {
        const internalValue = vm.internalValue.slice()
        internalValue.splice(index, 1)
        setValue(internalValue)
      }
      if (menuIndex > -1) return (vm.internalSearch = null)
      selectItem(vm.internalSearch)
      vm.internalSearch = null
    }

    return {
      editingIndex,
      counterValue,
      hasSlot,
      isAnyValueAllowed,
      menuCanShow,
      onFilteredItemsChanged,
      onInternalSearchChanged,
      genChipSelection,
      onChipInput,
      onEnterDown,
      onKeyDown,
      onTabDown,
      selectItem,
      setSelectedItems,
      setValue,
      updateEditing,
      updateCombobox,
      updateSelf,
      updateTags
    }
  }
})

