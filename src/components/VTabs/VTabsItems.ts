import { defineComponent, getCurrentInstance, inject, onBeforeUnmount, watch } from 'vue'

import VWindow from '../VWindow/VWindow'

export default defineComponent({
  name: 'v-tabs-items',

  extends: VWindow,

  props: {
    cycle: Boolean
  },

  setup (props) {
    const registerItems = inject<((fn: (val: any) => void) => void) | null>('registerItems', null)
    const unregisterItems = inject<(() => void) | null>('unregisterItems', null)
    const tabProxy = inject<((val: any) => void) | null>('tabProxy', null)

    const vm = getCurrentInstance()
    const proxy = vm?.proxy as any

    function changeModel (val: any) {
      if (!proxy) return
      proxy.internalValue = val
    }

    function getValue (item: any, i: number) {
      if (item && item.id) return item.id
      return VWindow.options.methods.getValue.call(proxy, item, i)
    }

    function next () {
      if (!proxy) return
      if (!props.cycle && proxy.internalIndex === proxy.items.length - 1) return
      VWindow.options.methods.next.call(proxy)
    }

    function prev () {
      if (!proxy) return
      if (!props.cycle && proxy.internalIndex === 0) return
      VWindow.options.methods.prev.call(proxy)
    }

    if (proxy) {
      Object.assign(proxy, {
        changeModel,
        getValue,
        next,
        prev
      })
    }

    registerItems && registerItems(changeModel)

    onBeforeUnmount(() => {
      unregisterItems && unregisterItems()
    })

    watch(() => proxy?.internalValue, (val) => {
      tabProxy && tabProxy(val)
    })

    return {}
  }
})
