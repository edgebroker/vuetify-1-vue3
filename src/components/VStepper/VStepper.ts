import '@/css/vuetify.css'

import VStepperStep from './VStepperStep'
import VStepperContent from './VStepperContent'

import useRegistrableProvide from '../../composables/useRegistrableProvide'
import useThemeable, { themeProps } from '../../composables/useThemeable'

import { defineComponent, h, ref, computed, watch, nextTick, onMounted, provide } from 'vue'

export type VStepperStepInstance = InstanceType<typeof VStepperStep>
export type VStepperContentInstance = InstanceType<typeof VStepperContent>

export default defineComponent({
  name: 'v-stepper',

  props: {
    ...themeProps,
    nonLinear: Boolean,
    altLabels: Boolean,
    vertical: Boolean,
    value: [Number, String]
  },

  setup (props, { slots, attrs, emit }) {
    const { themeClasses } = useThemeable(props)
    const { register: baseRegister, unregister: baseUnregister } = useRegistrableProvide('stepper')

    const steps: VStepperStepInstance[] = []
    const content: VStepperContentInstance[] = []

    const inputValue = ref<any>(null)
    const isBooted = ref(false)
    const isReverse = ref(false)

    function stepClick (step: string | number) {
      nextTick(() => { inputValue.value = step })
    }

    function register (item: any) {
      baseRegister(item)

      const name = item && item.$options ? item.$options.name : undefined

      if (name === 'v-stepper-step') {
        if (!steps.includes(item)) steps.push(item as VStepperStepInstance)
        if (inputValue.value !== null && typeof item.toggle === 'function') {
          item.toggle(inputValue.value)
        }
      } else if (name === 'v-stepper-content') {
        if (!content.includes(item)) content.push(item as VStepperContentInstance)
        if (typeof item.setVertical === 'function') item.setVertical(props.vertical)
        if (inputValue.value !== null && typeof item.toggle === 'function') {
          item.toggle(inputValue.value, isReverse.value)
        }
      }
    }

    function unregister (item: any) {
      const name = item && item.$options ? item.$options.name : undefined

      if (name === 'v-stepper-step') {
        const index = steps.indexOf(item as VStepperStepInstance)
        if (index > -1) steps.splice(index, 1)
      } else if (name === 'v-stepper-content') {
        const index = content.indexOf(item as VStepperContentInstance)
        if (index > -1) content.splice(index, 1)
      }

      baseUnregister(item)
    }

    provide('stepper', { register, unregister })
    provide('stepClick', stepClick)
    provide('isVertical', computed(() => props.vertical))

    const classes = computed(() => ({
      'v-stepper--is-booted': isBooted.value,
      'v-stepper--vertical': props.vertical,
      'v-stepper--alt-labels': props.altLabels,
      'v-stepper--non-linear': props.nonLinear,
      ...themeClasses.value
    }))

    watch(inputValue, (val, prev) => {
      isReverse.value = Number(val) < Number(prev)

      for (let index = steps.length - 1; index >= 0; index--) {
        const step = steps[index]
        step && typeof step.toggle === 'function' && step.toggle(val)
      }

      for (let index = content.length - 1; index >= 0; index--) {
        const item = content[index]
        item && typeof item.toggle === 'function' && item.toggle(val, isReverse.value)
      }

      emit('input', val)
      if (prev) isBooted.value = true
    })

    watch(() => props.value, val => {
      nextTick(() => { inputValue.value = val })
    })

    watch(() => props.vertical, val => {
      for (let index = content.length - 1; index >= 0; index--) {
        const item = content[index]
        if (typeof item.setVertical === 'function') item.setVertical(val)
      }
    })

    onMounted(() => {
      inputValue.value = props.value != null
        ? props.value
        : steps[0] && (steps[0] as any).step || 1
    })

    return () => {
      const { class: classAttr, style, ...restAttrs } = attrs as any

      return h('div', {
        class: ['v-stepper', classes.value, classAttr],
        style,
        ...restAttrs
      }, slots.default?.())
    }
  }
})
