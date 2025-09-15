// Components
import VIcon from '../VIcon'

// Directives
import Ripple from '../../directives/ripple'

// Composables
import useColorable from '../../composables/useColorable'
import useRegistrableInject from '../../composables/useRegistrableInject'

// Types
import { defineComponent, h, computed, ref, inject, getCurrentInstance, onMounted, onBeforeUnmount, withDirectives, PropType } from 'vue'

type VuetifyStepperRuleValidator = () => string | false

export default defineComponent({
  name: 'v-stepper-step',

  directives: { Ripple },

  props: {
    color: {
      type: String,
      default: 'primary',
    },
    complete: Boolean,
    completeIcon: {
      type: String,
      default: '$vuetify.icons.complete',
    },
    editIcon: {
      type: String,
      default: '$vuetify.icons.edit',
    },
    errorIcon: {
      type: String,
      default: '$vuetify.icons.error',
    },
    editable: Boolean,
    rules: {
      type: Array as PropType<VuetifyStepperRuleValidator[]>,
      default: () => ([]),
    },
    step: [Number, String],
  },

  emits: ['click'],

  setup (props, { slots, emit, expose }) {
    const { setBackgroundColor } = useColorable(props)
    const stepper = useRegistrableInject('stepper', 'v-stepper-step', 'v-stepper') as any
    const stepClick = inject<(step: number | string | undefined) => void>('stepClick', () => {})

    const isActive = ref(false)
    const isInactive = ref(true)

    const classes = computed(() => ({
      'v-stepper__step': true,
      'v-stepper__step--active': isActive.value,
      'v-stepper__step--editable': props.editable,
      'v-stepper__step--inactive': isInactive.value,
      'v-stepper__step--error': hasError.value,
      'v-stepper__step--complete': props.complete,
      'error--text': hasError.value,
    }))

    const hasError = computed(() => props.rules.some(validate => validate() !== true))

    function toggle (step: number | string) {
      if (props.step == null) return
      const current = step.toString()
      const target = props.step.toString()
      isActive.value = current === target
      isInactive.value = Number(step) < Number(props.step)
    }

    function onClick (e: MouseEvent) {
      e.stopPropagation()
      emit('click', e)
      if (props.editable) {
        stepClick(props.step)
      }
    }

    const vm = getCurrentInstance()

    onMounted(() => {
      stepper && stepper.register && vm?.proxy && stepper.register(vm.proxy)
    })

    onBeforeUnmount(() => {
      stepper && stepper.unregister && vm?.proxy && stepper.unregister(vm.proxy)
    })

    expose({ toggle, isActive, isInactive })

    return () => {
      let stepContent

      if (hasError.value) {
        stepContent = [h(VIcon, {}, { default: () => props.errorIcon })]
      } else if (props.complete) {
        if (props.editable) {
          stepContent = [h(VIcon, {}, { default: () => props.editIcon })]
        } else {
          stepContent = [h(VIcon, {}, { default: () => props.completeIcon })]
        }
      } else {
        stepContent = String(props.step)
      }

      const color = (!hasError.value && (props.complete || isActive.value)) ? props.color : false
      const stepNode = h('span', setBackgroundColor(color, {
        staticClass: 'v-stepper__step__step',
      }), stepContent)

      const labelNode = h('div', { staticClass: 'v-stepper__label' }, slots.default?.())

      const node = h('div', {
        class: classes.value,
        on: { click: onClick },
      }, [stepNode, labelNode])

      return withDirectives(node, [[Ripple, props.editable]])
    }
  },
})
