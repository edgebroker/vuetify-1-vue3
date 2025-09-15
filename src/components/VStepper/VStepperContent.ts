import { VTabTransition, VTabReverseTransition } from '../transitions'

import useRegistrableInject from '../../composables/useRegistrableInject'

import { convertToUnit } from '../../util/helpers'

import {
  defineComponent,
  h,
  ref,
  computed,
  getCurrentInstance,
  onMounted,
  onBeforeUnmount,
  withDirectives,
  vShow,
  watch,
  inject,
  isRef
} from 'vue'

export default defineComponent({
  name: 'v-stepper-content',

  props: {
    step: {
      type: [Number, String],
      required: true
    }
  },

  setup (props, { slots, attrs, expose }) {
    const stepper = useRegistrableInject('stepper', 'v-stepper-content', 'v-stepper')
    const injectedVertical = inject<any>('isVertical', false)

    const height = ref<number | string>(0)
    const isActive = ref<boolean | null>(null)
    const isReverse = ref(false)
    const wrapper = ref<HTMLElement | null>(null)

    const verticalSource = isRef(injectedVertical) ? injectedVertical : undefined
    const isVertical = ref<boolean>(verticalSource ? !!verticalSource.value : !!injectedVertical)

    if (verticalSource) {
      watch(verticalSource, val => { isVertical.value = !!val }, { immediate: true })
    }

    if (!isVertical.value) height.value = 'auto'

    const wrapperClasses = computed(() => ({
      'v-stepper__wrapper': true
    }))

    const styles = computed(() => {
      if (!isVertical.value) return {}

      return {
        height: convertToUnit(height.value)
      }
    })

    const computedTransition = computed(() => isReverse.value ? VTabReverseTransition : VTabTransition)

    const vm = getCurrentInstance()

    function onTransition (e: TransitionEvent) {
      if (!isActive.value || e.propertyName !== 'height') return

      height.value = 'auto'
    }

    function enter () {
      let scrollHeight = 0

      requestAnimationFrame(() => {
        scrollHeight = wrapper.value ? wrapper.value.scrollHeight : 0
      })

      height.value = 0

      setTimeout(() => {
        if (isActive.value) height.value = scrollHeight || 'auto'
      }, 450)
    }

    function leave () {
      if (!wrapper.value) return

      height.value = wrapper.value.clientHeight
      setTimeout(() => { height.value = 0 }, 10)
    }

    function toggle (step: string | number, reverse: boolean) {
      const stringStep = step != null ? step.toString() : ''
      isActive.value = stringStep === props.step.toString()
      isReverse.value = reverse
    }

    function setVertical (val: boolean) {
      isVertical.value = !!val
      if (!isVertical.value) height.value = 'auto'
    }

    watch(isActive, (current, previous) => {
      if (current && previous == null) {
        height.value = 'auto'
        return
      }

      if (!isVertical.value) return

      if (isActive.value) enter()
      else leave()
    })

    onMounted(() => {
      wrapper.value && wrapper.value.addEventListener('transitionend', onTransition, false)
      stepper && stepper.register && stepper.register(vm?.proxy)
    })

    onBeforeUnmount(() => {
      wrapper.value && wrapper.value.removeEventListener('transitionend', onTransition, false)
      stepper && stepper.unregister && stepper.unregister(vm?.proxy)
    })

    expose({ toggle, setVertical })

    return () => {
      const attrsObj = attrs as Record<string, any>
      const classAttr = attrsObj.class
      const style = attrsObj.style
      const listeners: Record<string, any> = {}
      const restAttrs: Record<string, any> = {}

      for (const key in attrsObj) {
        if (key === 'class' || key === 'style') continue
        if (key.startsWith('on')) listeners[key] = attrsObj[key]
        else restAttrs[key] = attrsObj[key]
      }

      const wrapperNode = h('div', {
        class: ['v-stepper__wrapper', wrapperClasses.value],
        style: styles.value,
        ref: wrapper
      }, slots.default?.())

      let contentNode = h('div', {
        class: ['v-stepper__content', classAttr],
        style,
        ...restAttrs
      }, [wrapperNode])

      if (!isVertical.value) {
        contentNode = withDirectives(contentNode, [[vShow, !!isActive.value]])
      }

      return h(computedTransition.value, listeners, { default: () => [contentNode] })
    }
  }
})
