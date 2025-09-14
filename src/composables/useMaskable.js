import { computed, nextTick, onBeforeMount, ref, watch } from 'vue'
import {
  isMaskDelimiter,
  maskText as maskTextOriginal,
  unmaskText as unmaskTextOriginal,
} from '../../packages/vuetify/src/util/mask'

export default function useMaskable (props, { emit }) {
  const selection = ref(0)
  const lazySelection = ref(0)
  const lazyValue = ref(props.value)
  const input = ref(null)

  const preDefined = {
    'credit-card': '#### - #### - #### - ####',
    'date': '##/##/####',
    'date-with-time': '##/##/#### ##:##',
    'phone': '(###) ### - ####',
    'social': '###-##-####',
    'time': '##:##',
    'time-with-seconds': '##:##:##',
  }

  const masked = computed(() => {
    const preDefinedMask = preDefined[props.mask]
    const mask = preDefinedMask || props.mask || ''
    return mask.split('')
  })

  const maskText = text => {
    return props.mask ? maskTextOriginal(text, masked.value, props.dontFillMaskBlanks) : text
  }
  const unmaskText = text => {
    return props.mask && !props.returnMaskedValue ? unmaskTextOriginal(text) : text
  }

  watch(() => props.value, val => { lazyValue.value = val })

  watch(() => props.mask, () => {
    if (!input.value) return

    const oldValue = input.value.value
    const newValue = maskText(unmaskText(lazyValue.value))
    let position = 0
    let sel = selection.value

    for (let index = 0; index < sel; index++) {
      isMaskDelimiter(oldValue[index]) || position++
    }

    sel = 0
    if (newValue) {
      for (let index = 0; index < newValue.length; index++) {
        isMaskDelimiter(newValue[index]) || position--
        sel++
        if (position <= 0) break
      }
    }

    nextTick(() => {
      if (!input.value) return
      input.value.value = newValue
      setCaretPosition(sel)
    })
  })

  onBeforeMount(() => {
    if (!props.mask || props.value == null || !props.returnMaskedValue) return

    const value = maskText(props.value)
    if (value === props.value) return

    emit('input', value)
  })

  function setCaretPosition (sel) {
    selection.value = sel
    window.setTimeout(() => {
      input.value && input.value.setSelectionRange(selection.value, selection.value)
    }, 0)
  }

  function updateRange () {
    if (!input.value) return

    const newValue = maskText(lazyValue.value)
    let sel = 0

    input.value.value = newValue
    if (newValue) {
      for (let index = 0; index < newValue.length; index++) {
        if (lazySelection.value <= 0) break
        isMaskDelimiter(newValue[index]) || lazySelection.value--
        sel++
      }
    }

    setCaretPosition(sel)
    emit('input', props.returnMaskedValue ? input.value.value : lazyValue.value)
  }

  function setSelectionRange () {
    nextTick(updateRange)
  }

  function resetSelections (el) {
    if (!el.selectionEnd) return
    selection.value = el.selectionEnd
    lazySelection.value = 0

    for (let index = 0; index < selection.value; index++) {
      isMaskDelimiter(el.value[index]) || lazySelection.value++
    }
  }

  return {
    input,
    selection,
    lazySelection,
    lazyValue,
    masked,
    maskText,
    unmaskText,
    setCaretPosition,
    updateRange,
    setSelectionRange,
    resetSelections,
  }
}

