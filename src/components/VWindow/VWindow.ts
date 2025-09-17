// Styles
import "@/css/vuetify.css"

// Components
import { BaseItemGroup } from '../VItemGroup/VItemGroup'

// Directives
import Touch from '../../directives/touch'

// Types
import { defineComponent, h, ref, computed, watch, provide, nextTick, getCurrentInstance, onMounted } from 'vue'
import { VNodeDirective } from 'vue/types/vnode'

export interface VWindowProvide {
  activeClass?: string
  computedTransition: string
  internalHeight: string | undefined
  internalIndex: number
  internalReverse: boolean
  isActive: boolean
  isBooted: boolean
  isReverse: boolean
  next: () => void
  prev: () => void
  register: (vm: any) => void
  unregister: (vm: any) => void
  updateReverse: (val: number, oldVal: number) => void
}

function windowGetValue (this: any, item: any, i: number) {
  const value = item && (item.value ?? item.id)
  return value == null || value === '' ? i : value
}

function windowNext (this: any) {
  const items: any[] = this.items || []
  if (!items.length) return

  this.isReverse = false

  const index = typeof this.internalIndex === 'number' ? this.internalIndex : -1
  const nextIndex = (index + 1 + items.length) % items.length
  const item = items[nextIndex]

  if (!item) return

  const getValue = this.getValue || windowGetValue
  this.internalValue = getValue.call(this, item, nextIndex)
}

function windowPrev (this: any) {
  const items: any[] = this.items || []
  if (!items.length) return

  this.isReverse = true

  const index = typeof this.internalIndex === 'number' ? this.internalIndex : -1
  const lastIndex = (index + items.length - 1 + items.length) % items.length
  const item = items[lastIndex]

  if (!item) return

  const getValue = this.getValue || windowGetValue
  this.internalValue = getValue.call(this, item, lastIndex)
}

function windowUpdateReverse (this: any, val: number, oldVal: number) {
  this.isReverse = val < oldVal
}

const VWindow = defineComponent({
  name: 'v-window',

  extends: BaseItemGroup,

  directives: { Touch },

  props: {
    mandatory: {
      type: Boolean,
      default: true
    },
    reverse: {
      type: Boolean,
      default: undefined
    },
    touch: Object,
    touchless: Boolean,
    value: {
      required: false
    },
    vertical: Boolean
  },

  setup (props, { slots, attrs }) {
    const vm = getCurrentInstance()
    const proxy = vm?.proxy as any

    const internalHeight = ref<string | undefined>(undefined)
    const isActive = ref(false)
    const isBooted = ref(false)
    const isReverse = ref(false)

    const internalReverse = computed(() => {
      return props.reverse !== undefined ? props.reverse : isReverse.value
    })

    const computedTransition = computed(() => {
      if (!isBooted.value) return ''

      const axis = props.vertical ? 'y' : 'x'
      const rtl = Boolean(proxy?.$vuetify?.rtl)
      const direction = internalReverse.value === !rtl ? '-reverse' : ''

      return `v-window-${axis}${direction}-transition`
    })

    const internalIndex = computed(() => {
      const items: any[] = proxy?.items || []
      const getValue = proxy?.getValue || windowGetValue

      return items.findIndex((item, i) => proxy?.internalValue === getValue.call(proxy, item, i))
    })

    function updateReverse (val: number, oldVal: number) {
      if (!proxy) return
      windowUpdateReverse.call(proxy, val, oldVal)
    }

    watch(internalIndex, (val, oldVal) => {
      updateReverse(val, oldVal)
    })

    onMounted(() => {
      nextTick(() => { isBooted.value = true })
    })

    if (proxy) {
      Object.defineProperties(proxy, {
        internalHeight: {
          get: () => internalHeight.value,
          set: (val) => { internalHeight.value = val }
        },
        isActive: {
          get: () => isActive.value,
          set: (val) => { isActive.value = val }
        },
        isBooted: {
          get: () => isBooted.value,
          set: (val) => { isBooted.value = val }
        },
        isReverse: {
          get: () => isReverse.value,
          set: (val) => { isReverse.value = val }
        },
        internalReverse: {
          get: () => internalReverse.value
        },
        internalIndex: {
          get: () => internalIndex.value
        },
        computedTransition: {
          get: () => computedTransition.value
        }
      })

      Object.assign(proxy, {
        genContainer,
        next: () => windowNext.call(proxy),
        prev: () => windowPrev.call(proxy),
        updateReverse: (val: number, oldVal: number) => updateReverse(val, oldVal)
      })
    }

    const windowGroup = {} as VWindowProvide

    Object.defineProperties(windowGroup, {
      activeClass: {
        get: () => (proxy && 'activeClass' in proxy ? proxy.activeClass : (props as any).activeClass)
      },
      internalHeight: {
        get: () => internalHeight.value,
        set: (val: string | undefined) => { internalHeight.value = val }
      },
      isActive: {
        get: () => isActive.value,
        set: (val: boolean) => { isActive.value = val }
      },
      isBooted: {
        get: () => isBooted.value,
        set: (val: boolean) => { isBooted.value = val }
      },
      isReverse: {
        get: () => isReverse.value,
        set: (val: boolean) => { isReverse.value = val }
      },
      internalReverse: {
        get: () => internalReverse.value
      },
      internalIndex: {
        get: () => internalIndex.value
      },
      computedTransition: {
        get: () => computedTransition.value
      }
    })

    function register (item: any) {
      proxy?.register?.(item)
    }

    function unregister (item: any) {
      proxy?.unregister?.(item)
    }

    Object.assign(windowGroup, {
      register,
      unregister,
      next,
      prev,
      updateReverse: (val: number, oldVal: number) => updateReverse(val, oldVal)
    })

    provide('windowGroup', windowGroup)

    function genContainer () {
      return h('div', {
        staticClass: 'v-window__container',
        class: {
          'v-window__container--is-active': isActive.value
        },
        style: {
          height: internalHeight.value
        }
      }, slots.default?.())
    }

    function next () {
      proxy && windowNext.call(proxy)
    }

    function prev () {
      proxy && windowPrev.call(proxy)
    }

    return () => {
      const restAttrs = { ...attrs } as Record<string, any>
      const className = restAttrs.class
      const style = restAttrs.style
      delete restAttrs.class
      delete restAttrs.style

      const data: any = {
        staticClass: 'v-window',
        class: className,
        style,
        directives: [] as VNodeDirective[],
        ...restAttrs
      }

      if (!props.touchless) {
        const value = props.touch || {
          left: next,
          right: prev
        }

        data.directives.push({
          name: 'touch',
          value
        } as VNodeDirective)
      }

      return h('div', data, [genContainer()])
    }
  }
})

;(VWindow as any).options = {
  methods: {
    getValue: windowGetValue,
    next: windowNext,
    prev: windowPrev,
    updateReverse: windowUpdateReverse
  }
}

;(VWindow as any).extend = (ext: any) => defineComponent({ ...ext, extends: VWindow })

export default VWindow
