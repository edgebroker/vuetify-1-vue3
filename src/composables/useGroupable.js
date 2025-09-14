import { inject, ref, computed, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'

function registrableInject (namespace, child, parent) {
  const defaultImpl = child && parent ? {
    register: () => console.warn(`[Vuetify] The ${child} component must be used inside a ${parent}`),
    unregister: () => console.warn(`[Vuetify] The ${child} component must be used inside a ${parent}`)
  } : null

  return inject(namespace, defaultImpl)
}

export function factory (namespace, child, parent) {
  return function useGroupable (props, emit) {
    const group = registrableInject(namespace, child, parent)
    const vm = getCurrentInstance()

    const isActive = ref(false)

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
      if (group && group.unregister && vm) {
        group.unregister(vm.proxy)
      }
    })

    function toggle () {
      emit && emit('change')
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

