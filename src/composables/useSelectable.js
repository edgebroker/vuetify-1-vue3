import { h, ref, computed, watch } from 'vue'
import useComparable, { comparableProps } from './useComparable'

export const selectableProps = {
  color: {
    type: String,
    default: 'accent'
  },
  id: String,
  inputValue: null,
  falseValue: null,
  trueValue: null,
  multiple: {
    type: Boolean,
    default: null
  },
  label: String,
  ...comparableProps
}

export default function useSelectable (props, { emit, isDisabled = ref(false), validationState = ref(null) } = {}) {
  const { valueComparator } = useComparable(props)

  const lazyValue = ref(props.inputValue)

  const input = ref(null)
  const isFocused = ref(false)

  watch(() => props.inputValue, val => { lazyValue.value = val })

  const isMultiple = computed(() => {
    return props.multiple === true || (props.multiple === null && Array.isArray(lazyValue.value))
  })

  const isActive = computed(() => {
    const value = props.value
    const inputValue = lazyValue.value

    if (isMultiple.value) {
      if (!Array.isArray(inputValue)) return false

      return inputValue.some(item => valueComparator(item, value))
    }

    if (props.trueValue === undefined || props.falseValue === undefined) {
      return value
        ? valueComparator(value, inputValue)
        : Boolean(inputValue)
    }

    return valueComparator(inputValue, props.trueValue)
  })

  const computedColor = computed(() => {
    return isActive.value ? props.color : validationState.value
  })

  function genLabel () {
    if (!props.label) return null

    return h('label', {
      for: props.id,
      onClick: onChange
    }, props.label)
  }

  function genInput (type, attrs = {}) {
    return h('input', {
      ...attrs,
      'aria-label': props.label,
      'aria-checked': String(isActive.value),
      disabled: isDisabled.value,
      id: props.id,
      role: type,
      type,
      value: props.value,
      checked: isActive.value,
      onBlur,
      onChange,
      onFocus,
      ref: input
    })
  }

  function onBlur () {
    isFocused.value = false
  }

  function onFocus () {
    isFocused.value = true
  }

  function onChange () {
    if (isDisabled.value) return

    const value = props.value
    let inputValue = lazyValue.value

    if (isMultiple.value) {
      if (!Array.isArray(inputValue)) {
        inputValue = []
      }

      const length = inputValue.length

      inputValue = inputValue.filter(item => !valueComparator(item, value))

      if (inputValue.length === length) {
        inputValue.push(value)
      }
    } else if (props.trueValue !== undefined && props.falseValue !== undefined) {
      inputValue = valueComparator(inputValue, props.trueValue) ? props.falseValue : props.trueValue
    } else if (value) {
      inputValue = valueComparator(inputValue, value) ? null : value
    } else {
      inputValue = !inputValue
    }

    lazyValue.value = inputValue
    emit && emit('change', inputValue)
  }

  return {
    lazyValue,
    input,
    isFocused,
    isActive,
    isMultiple,
    computedColor,
    genLabel,
    genInput,
    onBlur,
    onFocus,
    onChange
  }
}
