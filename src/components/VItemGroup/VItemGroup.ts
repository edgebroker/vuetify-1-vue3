import '@/css/vuetify.css'

// Composables
import useProxyable from '../../composables/useProxyable'
import useThemeable, { themeProps } from '../../composables/useThemeable'

// Utilities
import { consoleWarn } from '../../util/console'

// Types
import { defineComponent, h, computed, provide, watch, nextTick, getCurrentInstance } from 'vue'

export const BaseItemGroup = defineComponent({
  name: 'base-item-group',

  props: {
    value: null,
    activeClass: {
      type: String,
      default: 'v-item--active'
    },
    mandatory: Boolean,
    max: {
      type: [Number, String],
      default: null
    },
    multiple: Boolean,
    ...themeProps
  },

  emits: ['change'],

  setup (props, { slots, emit }) {
    const { internalLazyValue, internalValue } = useProxyable(props, emit)
    const { themeClasses } = useThemeable(props)
    const items: any[] = []
    const vm = getCurrentInstance()

    if (props.multiple && !Array.isArray(internalValue.value)) {
      consoleWarn('Model must be bound to an array if the multiple property is true.', vm)
    }

    function getValue (item: any, i: number) {
      return item.value == null || item.value === '' ? i : item.value
    }

    function onClick (item: any, index: number) {
      updateInternalValue(getValue(item, index))
    }

    function register (item: any) {
      const index = items.push(item) - 1
      item.$on && item.$on('change', () => onClick(item, index))
      if (props.mandatory && internalLazyValue.value == null) {
        updateMandatory()
      }
      updateItem(item, index)
    }

    function unregister (item: any) {
      const index = items.indexOf(item)
      const value = getValue(item, index)
      items.splice(index, 1)
      const valueIndex = selectedValues.value.indexOf(value)
      if (valueIndex < 0) return
      if (!props.mandatory) {
        updateInternalValue(value)
        return
      }
      if (props.multiple && Array.isArray(internalValue.value)) {
        internalValue.value = internalValue.value.filter(v => v !== value)
      } else {
        internalValue.value = undefined
      }
      if (!selectedItems.value.length) {
        updateMandatory(true)
      }
    }

    function updateItem (item: any, index: number) {
      const value = getValue(item, index)
      item.isActive = toggleMethod.value(value)
    }

    const selectedItems = computed(() => items.filter((item, index) => toggleMethod.value(getValue(item, index))))

    const selectedValues = computed(() => Array.isArray(internalValue.value) ? internalValue.value : [internalValue.value])

    const toggleMethod = computed(() => {
      if (!props.multiple) {
        return (v: any) => internalValue.value === v
      }
      const internal = internalValue.value
      if (Array.isArray(internal)) {
        return (v: any) => internal.includes(v)
      }
      return () => false
    })

    function updateItemsState () {
      if (props.mandatory && !selectedItems.value.length) {
        return updateMandatory()
      }
      items.forEach((item, index) => updateItem(item, index))
    }

    function updateInternalValue (value: any) {
      props.multiple ? updateMultiple(value) : updateSingle(value)
    }

    function updateMandatory (last = false) {
      if (!items.length) return
      const index = last ? items.length - 1 : 0
      updateInternalValue(getValue(items[index], index))
    }

    function updateMultiple (value: any) {
      const internal = Array.isArray(internalValue.value) ? internalValue.value.slice() : []
      const index = internal.findIndex(val => val === value)
      if (props.mandatory && index > -1 && internal.length - 1 < 1) return
      if (props.max != null && index < 0 && internal.length + 1 > Number(props.max)) return
      index > -1 ? internal.splice(index, 1) : internal.push(value)
      internalValue.value = internal
    }

    function updateSingle (value: any) {
      const isSame = value === internalValue.value
      if (props.mandatory && isSame) return
      internalValue.value = isSame ? undefined : value
    }

    watch(internalValue, () => {
      nextTick(updateItemsState)
    })

    provide('itemGroup', { register, unregister, activeClass: props.activeClass })

    const classes = computed(() => ({
      ...themeClasses.value
    }))

    return () => h('div', {
      class: ['v-item-group', classes.value]
    }, slots.default && slots.default())
  }
})

export default defineComponent({
  name: 'v-item-group',
  extends: BaseItemGroup
})

;(BaseItemGroup as any).extend = (ext: any) => defineComponent({ ...ext, extends: BaseItemGroup })
