import { ref, watch } from 'vue'

export function factory (prop = 'value', event = 'input') {
  return function useToggleable (props, emit) {
    const isActive = ref(!!props[prop])

    watch(() => props[prop], val => { isActive.value = !!val })

    watch(isActive, val => {
      !!val !== props[prop] && emit && emit(event, val)
    })

    return { isActive }
  }
}

const useToggleable = factory()

export default useToggleable

