import { ref, watch } from 'vue'

export const returnableProps = {
  returnValue: null,
}

export default function useReturnable (props, { isActive, emit } = {}) {
  const isActiveRef = isActive || ref(false)
  const originalValue = ref(null)

  watch(isActiveRef, val => {
    if (val) {
      originalValue.value = props.returnValue
    } else {
      emit && emit('update:returnValue', originalValue.value)
    }
  })

  function save (value) {
    originalValue.value = value
    setTimeout(() => {
      isActiveRef.value = false
    })
  }

  return {
    isActive: isActiveRef,
    originalValue,
    save,
  }
}

