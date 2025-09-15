import { ref, getCurrentInstance, onMounted, nextTick } from 'vue'

export default function useSsrBootable () {
  const isBooted = ref(false)
  const vm = getCurrentInstance()

  onMounted(() => {
    nextTick(() => {
      const el = vm && vm.proxy && vm.proxy.$el
      if (!el) return

      // Use setAttribute instead of dataset
      // because dataset does not work well
      // with unit tests
      el.setAttribute('data-booted', 'true')
      isBooted.value = true
    })
  })

  return {
    isBooted
  }
}
