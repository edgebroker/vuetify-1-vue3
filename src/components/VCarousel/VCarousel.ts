// Styles
import "@/css/vuetify.css"

// Extensions
import VWindow from '../VWindow/VWindow'

// Components
import VBtn from '../VBtn'
import VIcon from '../VIcon'

// Utilities
import { convertToUnit } from '../../util/helpers'
import { deprecate } from '../../util/console'

// Vue
import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'
import { VNodeDirective } from 'vue/types/vnode'

export default defineComponent({
  name: 'v-carousel',
  extends: VWindow,

  props: {
    cycle: {
      type: Boolean,
      default: true,
    },
    delimiterIcon: {
      type: String,
      default: '$vuetify.icons.delimiter',
    },
    height: {
      type: [Number, String],
      default: 500,
    },
    hideControls: Boolean,
    hideDelimiters: Boolean,
    interval: {
      type: [Number, String],
      default: 6000,
      validator: (value: string | number) => value > 0,
    },
    mandatory: {
      type: Boolean,
      default: true,
    },
    nextIcon: {
      type: [Boolean, String],
      default: '$vuetify.icons.next',
    },
    prevIcon: {
      type: [Boolean, String],
      default: '$vuetify.icons.prev',
    },
  },

  setup (props, { attrs, emit }) {
    const vm = getCurrentInstance()!
    const proxy: any = vm.proxy
    const changedByDelimiters = ref(false)
    let slideTimeout: number | undefined

    function restartTimeout () {
      slideTimeout && clearTimeout(slideTimeout)
      slideTimeout = undefined
      const raf = requestAnimationFrame || setTimeout
      raf(startTimeout)
    }

    function startTimeout () {
      if (!props.cycle) return
      slideTimeout = window.setTimeout(proxy.next, +props.interval > 0 ? +props.interval : 6000)
    }

    function updateReverse (val: number, oldVal: number) {
      if (changedByDelimiters.value) {
        changedByDelimiters.value = false
        return
      }
      VWindow.options.methods.updateReverse.call(proxy, val, oldVal)
    }

    Object.assign(proxy, { updateReverse })

    watch(() => proxy.internalValue, val => {
      restartTimeout()
      emit('input', val)
    })

    watch(() => props.interval, restartTimeout)

    watch(() => props.height, (val, oldVal) => {
      if (val === oldVal || !val) return
      proxy.internalHeight = val
    })

    watch(() => props.cycle, val => {
      if (val) restartTimeout()
      else {
        clearTimeout(slideTimeout)
        slideTimeout = undefined
      }
    })

    onMounted(() => {
      if ((attrs as any).on && (attrs as any).on.input) {
        deprecate('@input', '@change', proxy)
      }
      startTimeout()
    })

    onBeforeUnmount(() => {
      clearTimeout(slideTimeout)
    })

    function genIcon (direction: 'prev' | 'next', icon: string, fn: () => void) {
      return h('div', { class: `v-carousel__${direction}` }, [
        h(VBtn, {
          props: { icon: true },
          attrs: {
            'aria-label': proxy.$vuetify.t(`$vuetify.carousel.${direction}`)
          },
          on: {
            click: () => {
              changedByDelimiters.value = true
              fn()
            }
          }
        }, [
          h(VIcon, { props: { size: '46px' } }, icon)
        ])
      ])
    }

    function genIcons () {
      const icons: any[] = []
      const prevIcon = proxy.$vuetify.rtl ? props.nextIcon : props.prevIcon
      if (prevIcon && typeof prevIcon === 'string') {
        icons.push(genIcon('prev', prevIcon as string, proxy.prev))
      }
      const nextIcon = proxy.$vuetify.rtl ? props.prevIcon : props.nextIcon
      if (nextIcon && typeof nextIcon === 'string') {
        icons.push(genIcon('next', nextIcon as string, proxy.next))
      }
      return icons
    }

    function genItems () {
      const length = proxy.items.length
      const children = []
      for (let i = 0; i < length; i++) {
        const value = proxy.getValue(proxy.items[i], i)
        const child = h(VBtn, {
          class: {
            'v-carousel__controls__item': true,
            'v-btn--active': proxy.internalValue === value
          },
          props: {
            icon: true,
            small: true,
            value
          },
          on: {
            click: () => {
              changedByDelimiters.value = true
              proxy.internalValue = value
            }
          }
        }, [
          h(VIcon, { props: { size: 18 } }, props.delimiterIcon)
        ])
        children.push(child)
      }
      return h('div', {}, children)
    }

    function genDelimiters () {
      return h('div', { class: 'v-carousel__controls' }, [genItems()])
    }

    return () => {
      const children: any[] = []
      const data: any = {
        class: 'v-window v-carousel',
        style: { height: convertToUnit(props.height) },
        directives: [] as VNodeDirective[]
      }

      if (!props.touchless) {
        data.directives.push({
          name: 'touch',
          value: { left: proxy.next, right: proxy.prev }
        } as VNodeDirective)
      }

      if (!props.hideControls) children.push(genIcons())
      if (!props.hideDelimiters) children.push(genDelimiters())

      return h('div', data, [proxy.genContainer(), children])
    }
  }
})
