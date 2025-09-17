// Extensions
import VWindow from '../VWindow/VWindow'

// Vue
import { defineComponent, computed, getCurrentInstance, inject, onBeforeUnmount, onMounted, watch } from 'vue'

const baseSetup = VWindow.setup

export default defineComponent({
  name: 'v-tabs-items',
  extends: VWindow,

  props: {
    cycle: Boolean
  },

  setup (props, ctx) {
    const render = typeof baseSetup === 'function' ? baseSetup(props, ctx) : undefined
    const { expose } = ctx
    const vm = getCurrentInstance()
    const proxy = vm && vm.proxy

    const registerItems = inject('registerItems', null)
    const tabProxy = inject('tabProxy', null)
    const unregisterItems = inject('unregisterItems', null)

    const internalValue = computed({
      get: () => proxy ? proxy.internalValue : undefined,
      set: val => {
        if (proxy) proxy.internalValue = val
      }
    })
    const internalIndex = computed(() => proxy && typeof proxy.internalIndex === 'number' ? proxy.internalIndex : -1)
    const items = computed(() => proxy && Array.isArray(proxy.items) ? proxy.items : [])

    function changeModel (val) {
      internalValue.value = val
    }

    function getValue (item, i) {
      if (item && item.id) return item.id

      return proxy ? VWindow.options.methods.getValue.call(proxy, item, i) : undefined
    }

    function next () {
      if (!proxy) return
      if (!props.cycle && internalIndex.value === items.value.length - 1) return

      VWindow.options.methods.next.call(proxy)
    }

    function prev () {
      if (!proxy) return
      if (!props.cycle && internalIndex.value === 0) return

      VWindow.options.methods.prev.call(proxy)
    }

    watch(() => internalValue.value, val => {
      if (tabProxy) tabProxy(val)
    })

    onMounted(() => {
      if (registerItems) registerItems(changeModel)
    })

    onBeforeUnmount(() => {
      if (unregisterItems) unregisterItems()
    })

    if (proxy) {
      Object.assign(proxy, {
        changeModel,
        getValue,
        next,
        prev
      })
    }

    expose({
      changeModel,
      getValue,
      next,
      prev
    })

    return render
  }
})
