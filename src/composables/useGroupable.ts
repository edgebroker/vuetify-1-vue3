import { ref, computed, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'
import useRegistrableInject from './useRegistrableInject'

export function factory (namespace, child, parent) {
  return function useGroupable (props, emit) {
    const group = useRegistrableInject(namespace, child, parent)
    const vm = getCurrentInstance()

    const isActive = ref(false)
    const changeHandlers = new Set<() => void>()

    const activeClass = computed(() => {
      if (props.activeClass !== undefined) return props.activeClass
      return group && group.activeClass
    })

    const groupClasses = computed(() => {
      const cls = activeClass.value
      if (!cls) return {}
      return { [cls]: isActive.value }
    })

    onMounted(() => {
      if (group && group.register && vm) {
        group.register(vm.proxy)
      }
    })

    onBeforeUnmount(() => {
      changeHandlers.clear()
      if (group && group.unregister && vm) {
        group.unregister(vm.proxy)
      }
    })

    function toggle () {
      emit && emit('change')
      changeHandlers.forEach(handler => handler())
    }

    const proxy = vm?.proxy as any

    if (proxy) {
      Object.defineProperty(proxy, 'isActive', {
        get: () => isActive.value,
        set: (val) => { isActive.value = val }
      })

      Object.defineProperty(proxy, 'value', {
        get: () => props.value
      })

      Object.defineProperty(proxy, 'groupClasses', {
        get: () => groupClasses.value
      })

      Object.defineProperty(proxy, 'activeClass', {
        get: () => activeClass.value
      })

      proxy.toggle = toggle

      proxy.$on = (event: string, handler: () => void) => {
        if (event !== 'change' || typeof handler !== 'function') return undefined

        changeHandlers.add(handler)

        return () => {
          changeHandlers.delete(handler)
        }
      }

      proxy.$off = (event: string, handler?: () => void) => {
        if (event !== 'change') return

        if (!handler) {
          changeHandlers.clear()
          return
        }

        changeHandlers.delete(handler)
      }
    }

    return {
      isActive,
      activeClass,
      groupClasses,
      toggle
    }
  }
}

const useGroupable = factory('itemGroup')

export default useGroupable

