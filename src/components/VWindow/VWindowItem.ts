// Components
import type { VWindowProvide } from './VWindow'

// Directives
import Touch from '../../directives/touch'

// Composables
import useBootable from '../../composables/useBootable'
import { factory as groupableFactory } from '../../composables/useGroupable'
import useRegistrableInject from '../../composables/useRegistrableInject'

// Utilities
import { convertToUnit } from '../../util/helpers'

// Types
import { defineComponent, h, ref, computed, getCurrentInstance, onMounted, onBeforeUnmount } from 'vue'
import { VNodeDirective } from 'vue/types/vnode'

const useWindowGroupable = groupableFactory('windowGroup', 'v-window-item', 'v-window')

function legacyWindowItemRender (this: any, h: any) {
  const div = h('div', {
    staticClass: 'v-window-item',
    directives: [{
      name: 'show',
      value: this.isActive
    }],
    on: this.$listeners
  }, this.showLazyContent(this.genDefaultSlot()))

  return h('transition', {
    props: {
      name: this.computedTransition
    },
    on: {
      afterEnter: this.onAfterEnter,
      beforeEnter: this.onBeforeEnter,
      leave: this.onLeave,
      enter: this.onEnter,
      enterCancelled: this.onEnterCancelled
    }
  }, [div])
}

const VWindowItem = defineComponent({
  name: 'v-window-item',

  directives: {
    Touch
  },

  props: {
    reverseTransition: {
      type: [Boolean, String],
      default: undefined
    },
    transition: {
      type: [Boolean, String],
      default: undefined
    },
    value: {
      required: false
    },
    lazy: Boolean
  },

  setup (props, { slots, attrs, emit }) {
    const vm = getCurrentInstance()
    const proxy = vm?.proxy as any
    const windowGroup = useRegistrableInject('windowGroup', 'v-window-item', 'v-window') as VWindowProvide | null
    const { isActive } = useWindowGroupable(props, emit)
    const { isBooted, showLazyContent } = useBootable(props, { isActive })

    const done = ref<null | (() => void)>(null)
    const wasCancelled = ref(false)

    const computedTransition = computed(() => {
      const fallback = windowGroup?.computedTransition ?? ''

      if (!windowGroup || !windowGroup.internalReverse) {
        return typeof props.transition !== 'undefined'
          ? props.transition || ''
          : fallback
      }

      return typeof props.reverseTransition !== 'undefined'
        ? props.reverseTransition || ''
        : fallback
    })

    if (proxy) {
      Object.defineProperties(proxy, {
        done: {
          get: () => done.value,
          set: (val) => { done.value = val }
        },
        isActive: {
          get: () => isActive.value,
          set: (val) => { isActive.value = val }
        },
        isBooted: {
          get: () => isBooted.value,
          set: (val) => { isBooted.value = val }
        },
        wasCancelled: {
          get: () => wasCancelled.value,
          set: (val) => { wasCancelled.value = val }
        },
        computedTransition: {
          get: () => computedTransition.value
        }
      })

      Object.assign(proxy, {
        genDefaultSlot,
        onAfterEnter,
        onBeforeEnter,
        onLeave,
        onEnter,
        onEnterCancelled,
        onTransitionEnd,
        showLazyContent,
        windowGroup
      })
    }

    onMounted(() => {
      proxy?.$el?.addEventListener('transitionend', onTransitionEnd, false)
    })

    onBeforeUnmount(() => {
      proxy?.$el?.removeEventListener('transitionend', onTransitionEnd, false)
    })

    function genDefaultSlot () {
      return slots.default?.()
    }

    function onAfterEnter () {
      if (wasCancelled.value) {
        wasCancelled.value = false
        return
      }

      requestAnimationFrame(() => {
        if (!windowGroup) return
        windowGroup.internalHeight = undefined
        windowGroup.isActive = false
      })
    }

    function onBeforeEnter () {
      if (!windowGroup) return
      windowGroup.isActive = true
    }

    function onLeave (el: HTMLElement) {
      if (!windowGroup) return
      windowGroup.internalHeight = convertToUnit(el.clientHeight)
    }

    function onEnterCancelled () {
      wasCancelled.value = true
    }

    function onEnter (el: HTMLElement, transitionDone: () => void) {
      const booted = windowGroup?.isBooted

      if (booted) done.value = transitionDone

      requestAnimationFrame(() => {
        if (!computedTransition.value) return transitionDone()

        if (windowGroup) {
          windowGroup.internalHeight = convertToUnit(el.clientHeight)
        }

        !booted && setTimeout(transitionDone, 100)
      })
    }

    function onTransitionEnd (e: TransitionEvent) {
      if (
        e.propertyName !== 'transform' ||
        e.target !== proxy?.$el ||
        !done.value
      ) return

      done.value()
      done.value = null
    }

    return () => {
      const restAttrs = { ...attrs } as Record<string, any>
      const className = restAttrs.class
      const style = restAttrs.style
      const on = restAttrs.on
      delete restAttrs.class
      delete restAttrs.style
      delete restAttrs.on

      const directives = [{
        name: 'show',
        value: isActive.value
      } as VNodeDirective]

      const div = h('div', {
        staticClass: 'v-window-item',
        class: className,
        style,
        directives,
        on,
        ...restAttrs
      }, showLazyContent(genDefaultSlot()))

      return h('transition', {
        props: {
          name: computedTransition.value
        },
        on: {
          afterEnter: onAfterEnter,
          beforeEnter: onBeforeEnter,
          leave: onLeave,
          enter: onEnter,
          enterCancelled: onEnterCancelled
        }
      }, [div])
    }
  }
})

;(VWindowItem as any).options = {
  render: legacyWindowItemRender
}

;(VWindowItem as any).extend = (ext: any) => defineComponent({ ...ext, extends: VWindowItem })

export default VWindowItem
