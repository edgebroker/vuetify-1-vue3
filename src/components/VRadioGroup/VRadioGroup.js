// Styles
import "@/css/vuetify.css"

// Composables
import useComparable, { comparableProps } from '../../composables/useComparable'
import useValidatable, { validatableProps } from '../../composables/useValidatable'

// Types
import { defineComponent, h, ref, computed, watch, provide, getCurrentInstance, useAttrs } from 'vue'

export default defineComponent({
  name: 'v-radio-group',

  props: {
    column: {
      type: Boolean,
      default: true,
    },
    height: {
      type: [Number, String],
      default: 'auto',
    },
    mandatory: {
      type: Boolean,
      default: true,
    },
    name: String,
    row: Boolean,
    ...validatableProps,
    ...comparableProps,
    value: {
      default: null,
    },
  },

  emits: ['change', 'blur', 'update:error'],

  setup (props, { slots, emit }) {
    const attrs = useAttrs()
    const vm = getCurrentInstance()

    function proxyEmit (event, ...args) {
      if (event === 'input') emit('change', ...args)
      else emit(event, ...args)
    }

    const { validationState, hasError, internalValue, validate } = useValidatable(props, { emit: proxyEmit })
    const { valueComparator } = useComparable(props)

    const radios = ref([])

    function setActiveRadios () {
      radios.value.forEach(radio => {
        radio.setIsActive(valueComparator(internalValue.value, radio.value.value))
      })
    }

    function setErrorState (val) {
      radios.value.forEach(radio => radio.setParentError(val))
    }

    function register (radio) {
      if (radios.value.includes(radio)) return
      radios.value.push(radio)
      radio.setIsActive(valueComparator(internalValue.value, radio.value.value))
      radio.setParentError(hasError.value)
    }

    function unregister (radio) {
      const index = radios.value.indexOf(radio)
      if (index > -1) radios.value.splice(index, 1)
    }

    function onRadioChange (value) {
      if (props.disabled) return
      internalValue.value = value
      setActiveRadios()
      validate()
    }

    function onRadioBlur (e) {
      const target = e.relatedTarget
      if (!target || !target.classList || !target.classList.contains('v-radio')) {
        emit('blur', e)
      }
    }

    watch(hasError, val => {
      setErrorState(val)
    }, { immediate: true })

    watch(() => internalValue.value, () => {
      setActiveRadios()
    }, { immediate: true })

    provide('radio', {
      register,
      unregister,
      onRadioChange,
      onRadioBlur,
      validationState: () => validationState.value || false,
      disabled: () => !!props.disabled,
      readonly: () => !!props.readonly,
      mandatory: () => !!props.mandatory,
      name: () => props.name,
      uid: vm ? vm.uid : undefined,
    })

    const classes = computed(() => ({
      'v-input--radio-group--column': props.column && !props.row,
      'v-input--radio-group--row': props.row,
    }))

    return () => {
      const rawAttrs = { ...attrs }
      const { class: className, style, ...restAttrs } = rawAttrs

      return h('div', {
        ...restAttrs,
        class: [
          'v-input--selection-controls',
          'v-input--radio-group',
          classes.value,
          className,
        ],
        style,
      }, [
        h('div', {
          class: 'v-input--radio-group__input',
          role: 'radiogroup',
        }, slots.default ? slots.default() : []),
      ])
    }
  },
})

