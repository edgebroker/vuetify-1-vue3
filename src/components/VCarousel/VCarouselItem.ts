// Extensions
import VWindowItem from '../VWindow/VWindowItem'

// Components
import { VImg } from '../VImg'

// Vue
import { defineComponent, h, getCurrentInstance } from 'vue'

export default defineComponent({
  name: 'v-carousel-item',
  extends: VWindowItem,
  inheritAttrs: false,

  setup (props, { slots, attrs }) {
    const vm = getCurrentInstance()!
    const proxy: any = vm.proxy

    function genDefaultSlot () {
      const data: any = { ...attrs, class: ['v-carousel__item', attrs.class], height: proxy.windowGroup.internalHeight }
      return [h(VImg, data, slots.default?.())]
    }

    function onBeforeEnter () {}
    function onEnter () {}
    function onAfterEnter () {}
    function onBeforeLeave () {}
    function onEnterCancelled () {}

    Object.assign(proxy, { genDefaultSlot, onBeforeEnter, onEnter, onAfterEnter, onBeforeLeave, onEnterCancelled })

    return {}
  }
})
