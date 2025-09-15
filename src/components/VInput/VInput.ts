// Styles
import "@/css/vuetify.css"

// Components
import VIcon from '../VIcon'
import VLabel from '../VLabel'
import VMessages from '../VMessages'

// Composables
import useColorable, { colorProps } from '../../composables/useColorable'
import useThemeable, { themeProps } from '../../composables/useThemeable'
import useValidatable, { validatableProps } from '../../composables/useValidatable'

// Utilities
import { convertToUnit, kebabCase } from '../../util/helpers'

// Types
import { defineComponent, h, computed, ref } from 'vue'

export default defineComponent({
  name: 'v-input',

  props: {
    appendIcon: String,
    appendIconCb: Function,
    backgroundColor: {
      type: String,
      default: ''
    },
    height: [Number, String],
    hideDetails: Boolean,
    hint: String,
    label: String,
    loading: Boolean,
    persistentHint: Boolean,
    prependIcon: String,
    prependIconCb: Function,
    value: { required: false },
    ...colorProps,
    ...themeProps,
    ...validatableProps
  },

  setup (props, { slots, attrs, emit }) {
    const { setBackgroundColor, setTextColor } = useColorable(props)
    const { themeClasses } = useThemeable(props)
    const {
      validationState,
      hasMessages,
      hasState,
      isFocused,
      validations,
      lazyValue
    } = useValidatable(props, { emit })

    const hasMouseDown = ref(false)

    const isDirty = computed(() => !!lazyValue.value)
    const isLabelActive = computed(() => isDirty.value)
    const hasHint = computed(() => !hasMessages.value && props.hint && (props.persistentHint || isFocused.value))
    const hasLabel = computed(() => Boolean(slots.label || props.label))

    const classesInput = computed(() => ({
      'v-input--has-state': hasState.value,
      'v-input--hide-details': props.hideDetails,
      'v-input--is-label-active': isLabelActive.value,
      'v-input--is-dirty': isDirty.value,
      'v-input--is-disabled': props.disabled,
      'v-input--is-focused': isFocused.value,
      'v-input--is-loading': props.loading !== false && props.loading !== undefined,
      'v-input--is-readonly': props.readonly,
      ...themeClasses.value
    }))

    function genLabel () {
      if (!hasLabel.value) return null
      return h(VLabel, {
        color: validationState.value,
        dark: props.dark,
        focused: hasState.value,
        for: attrs.id,
        light: props.light
      }, {
        default: () => slots.label ? slots.label() : props.label
      })
    }

    function genMessages () {
      if (props.hideDetails) return null
      const messages = hasHint.value ? [props.hint] : validations.value
      return h(VMessages, {
        color: hasHint.value ? '' : validationState.value,
        dark: props.dark,
        light: props.light,
        value: (hasMessages.value || hasHint.value) ? messages : []
      }, slots.message ? { default: slots.message } : undefined)
    }

    function genDefaultSlot () {
      return [genLabel(), slots.default?.()]
    }

    function onClick (e: Event) {
      emit('click', e)
    }
    function onMouseDown (e: Event) {
      hasMouseDown.value = true
      emit('mousedown', e)
    }
    function onMouseUp (e: Event) {
      hasMouseDown.value = false
      emit('mouseup', e)
    }

    function genIcon (type: string, cb?: (e: Event) => void) {
      const icon = (props as any)[`${type}Icon`]
      const eventName = `click:${kebabCase(type)}`
      cb = cb || (props as any)[`${type}IconCb`]
      const data: any = {
        color: validationState.value,
        dark: props.dark,
        disabled: props.disabled,
        light: props.light,
        onClick: (e: Event) => {
          e.preventDefault()
          e.stopPropagation()
          emit(eventName, e)
          cb && cb(e)
        }
      }
      return h('div', {
        class: `v-input__icon v-input__icon--${kebabCase(type)}`,
        key: `${type}${icon}`
      }, [h(VIcon, data, { default: () => icon })])
    }

    function genSlot (type: string, location: string, slot: any[]) {
      if (!slot.length) return null
      const refName = `${type}-${location}`
      return h('div', { class: `v-input__${refName}`, ref: refName }, slot)
    }

    function genPrependSlot () {
      const slot: any[] = []
      if (slots.prepend) slot.push(slots.prepend())
      else if (props.prependIcon) slot.push(genIcon('prepend'))
      return genSlot('prepend', 'outer', slot)
    }

    function genAppendSlot () {
      const slot: any[] = []
      if (slots.append) slot.push(slots.append())
      else if (props.appendIcon) slot.push(genIcon('append'))
      return genSlot('append', 'outer', slot)
    }

    function genInputSlot () {
      return h('div', setBackgroundColor(props.backgroundColor, {
        class: 'v-input__slot',
        style: { height: convertToUnit(props.height) },
        on: {
          click: onClick,
          mousedown: onMouseDown,
          mouseup: onMouseUp
        }
      }), genDefaultSlot())
    }

    function genControl () {
      return h('div', { class: 'v-input__control' }, [
        genInputSlot(),
        genMessages()
      ])
    }

    function genContent () {
      return [genPrependSlot(), genControl(), genAppendSlot()]
    }

    return () => {
      const data = setTextColor(validationState.value, {
        class: ['v-input', classesInput.value],
        ...attrs
      })
      return h('div', data, genContent())
    }
  }
})
