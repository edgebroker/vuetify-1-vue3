import { ref, computed, watch, inject, getCurrentInstance, onMounted, onBeforeUnmount, onBeforeMount, nextTick } from 'vue'
import { deepEqual } from '../utl/helpers'
import { consoleError } from '../utl/console'

export const validatableProps = {
  disabled: Boolean,
  error: Boolean,
  errorCount: {
    type: [Number, String],
    default: 1,
  },
  errorMessages: {
    type: [String, Array],
    default: () => [],
  },
  messages: {
    type: [String, Array],
    default: () => [],
  },
  readonly: Boolean,
  rules: {
    type: Array,
    default: () => [],
  },
  success: Boolean,
  successMessages: {
    type: [String, Array],
    default: () => [],
  },
  validateOnBlur: Boolean,
  value: { required: false },
}

export default function useValidatable (props, { emit }) {
  const errorBucket = ref([])
  const hasFocused = ref(false)
  const hasInput = ref(false)
  const isFocused = ref(false)
  const isResetting = ref(false)
  const lazyValue = ref(props.value)
  const valid = ref(false)

  const form = inject('form', null)
  const vm = getCurrentInstance()

  function genInternalMessages (messages) {
    if (!messages) return []
    else if (Array.isArray(messages)) return messages
    else return [messages]
  }

  const internalErrorMessages = computed(() => genInternalMessages(props.errorMessages))
  const internalMessages = computed(() => genInternalMessages(props.messages))
  const internalSuccessMessages = computed(() => genInternalMessages(props.successMessages))

  const internalValue = computed({
    get () {
      return lazyValue.value
    },
    set (val) {
      lazyValue.value = val
      emit && emit('input', val)
    },
  })

  const externalError = computed(() => internalErrorMessages.value.length > 0 || props.error)

  const shouldValidate = computed(() => {
    if (externalError.value) return true
    if (isResetting.value) return false
    return props.validateOnBlur
      ? hasFocused.value && !isFocused.value
      : (hasInput.value || hasFocused.value)
  })

  const hasError = computed(() => {
    return (
      internalErrorMessages.value.length > 0 ||
      errorBucket.value.length > 0 ||
      props.error
    )
  })

  const hasSuccess = computed(() => {
    return (
      internalSuccessMessages.value.length > 0 ||
      props.success
    )
  })

  const validationTarget = computed(() => {
    if (internalErrorMessages.value.length > 0) {
      return internalErrorMessages.value
    } else if (internalSuccessMessages.value.length > 0) {
      return internalSuccessMessages.value
    } else if (internalMessages.value.length > 0) {
      return internalMessages.value
    } else if (shouldValidate.value) {
      return errorBucket.value
    } else return []
  })

  const validations = computed(() => validationTarget.value.slice(0, Number(props.errorCount)))

  const validationState = computed(() => {
    if (hasError.value && shouldValidate.value) return 'error'
    if (hasSuccess.value) return 'success'
    return undefined
  })

  const hasMessages = computed(() => validationTarget.value.length > 0)
  const hasState = computed(() => hasSuccess.value || (shouldValidate.value && hasError.value))

  function reset () {
    isResetting.value = true
    internalValue.value = Array.isArray(internalValue.value)
      ? []
      : undefined
  }

  function resetValidation () {
    isResetting.value = true
  }

  function validate (force = false, value) {
    const errorBucketLocal = []
    value = value !== undefined ? value : internalValue.value

    if (force) hasInput.value = hasFocused.value = true

    for (let i = 0; i < props.rules.length; i++) {
      const rule = props.rules[i]
      const validRule = typeof rule === 'function' ? rule(value) : rule

      if (typeof validRule === 'string') {
        errorBucketLocal.push(validRule)
      } else if (typeof validRule !== 'boolean') {
        consoleError(`Rules should return a string or boolean, received '${typeof validRule}' instead`)
      }
    }

    errorBucket.value = errorBucketLocal
    valid.value = errorBucket.value.length === 0

    return valid.value
  }

  watch(() => props.rules, (newVal, oldVal) => {
    if (deepEqual(newVal, oldVal)) return
    validate()
  }, { deep: true })

  watch(internalValue, () => {
    hasInput.value = true
    props.validateOnBlur || nextTick(validate)
  })

  watch(isFocused, val => {
    if (!val && !props.disabled && !props.readonly) {
      hasFocused.value = true
      props.validateOnBlur && validate()
    }
  })

  watch(isResetting, val => {
    if (val) {
      setTimeout(() => {
        hasInput.value = false
        hasFocused.value = false
        isResetting.value = false
        validate()
      }, 0)
    }
  })

  watch(hasError, val => {
    if (shouldValidate.value) {
      emit && emit('update:error', val)
    }
  })

  watch(() => props.value, val => {
    lazyValue.value = val
  })

  onBeforeMount(() => {
    validate()
  })

  onMounted(() => {
    if (form && form.register && vm) {
      form.register(vm.proxy)
    }
  })

  onBeforeUnmount(() => {
    if (form && form.unregister && vm) {
      form.unregister(vm.proxy)
    }
  })

  return {
    errorBucket,
    hasError,
    hasSuccess,
    hasMessages,
    hasState,
    internalErrorMessages,
    internalMessages,
    internalSuccessMessages,
    internalValue,
    isFocused,
    isResetting,
    lazyValue,
    shouldValidate,
    valid,
    validations,
    validationState,
    reset,
    resetValidation,
    validate,
  }
}

