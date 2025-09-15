import { ref, computed, watch } from 'vue'

export function factory (prop = 'value', event = 'change') {
  return function useProxyable (props, emit) {
    const internalLazyValue = ref(props[prop])

    watch(() => props[prop], val => {
      internalLazyValue.value = val
    })

    const internalValue = computed({
      get () {
        return internalLazyValue.value
      },
      set (val) {
        if (val === internalLazyValue.value) return

        internalLazyValue.value = val
        emit(event, val)
      }
    })

    return {
      internalLazyValue,
      internalValue,
    }
  }
}

const useProxyable = factory()

export default useProxyable
