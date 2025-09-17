// Styles
import "@/css/vuetify.css"

// Components
import VIcon from '../VIcon'
import VLabel from '../VLabel'

// Composables
import useColorable from '../../composables/useColorable'
import useRippleable, { rippleableProps } from '../../composables/useRippleable'
import useThemeable, { themeProps } from '../../composables/useThemeable'
import useRegistrableInject from '../../composables/useRegistrableInject'

// Types
import { defineComponent, h, ref, computed, onMounted, onBeforeUnmount, useAttrs } from 'vue'

export default defineComponent({
  name: 'v-radio',

  inheritAttrs: false,

  props: {
    color: {
      type: String,
      default: 'accent',
    },
    disabled: Boolean,
    label: String,
    onIcon: {
      type: String,
      default: '$vuetify.icons.radioOn',
    },
    offIcon: {
      type: String,
      default: '$vuetify.icons.radioOff',
    },
    readonly: Boolean,
    value: null,
    ...rippleableProps,
    ...themeProps,
  },

  emits: ['change', 'focus', 'blur'],

  setup (props, { slots, emit }) {
    const attrs = useAttrs()
    const radioGroup = useRegistrableInject('radio', 'v-radio', 'v-radio-group') || null
    const { setTextColor } = useColorable(props)
    const { themeClasses } = useThemeable(props)

    const isActive = ref(false)
    const isFocused = ref(false)
    const parentError = ref(false)

    const computedData = computed(() => {
      const color = !parentError.value && isActive.value ? props.color : undefined
      return setTextColor(color, {
        class: {
          'v-radio': true,
          'v-radio--is-disabled': isDisabled.value,
          'v-radio--is-focused': isFocused.value,
          ...themeClasses.value,
        },
      })
    })

    const computedColor = computed(() => {
      if (isActive.value) return props.color
      return radioGroup && radioGroup.validationState ? radioGroup.validationState() : false
    })

    const computedIcon = computed(() => (isActive.value ? props.onIcon : props.offIcon))

    const hasState = computed(() => {
      const validation = computedColor.value
      return isActive.value || !!validation
    })

    const isDisabled = computed(() => props.disabled || !!(radioGroup && radioGroup.disabled && radioGroup.disabled()))

    const isReadonly = computed(() => props.readonly || !!(radioGroup && radioGroup.readonly && radioGroup.readonly()))

    const radioValue = computed(() => props.value)

    const radioItem = {
      value: radioValue,
      setIsActive: val => { isActive.value = val },
      setParentError: val => { parentError.value = val },
    }

    onMounted(() => {
      radioGroup && radioGroup.register && radioGroup.register(radioItem)
    })

    onBeforeUnmount(() => {
      radioGroup && radioGroup.unregister && radioGroup.unregister(radioItem)
    })

    function onFocus (e) {
      isFocused.value = true
      emit('focus', e)
    }

    function onBlur (e) {
      isFocused.value = false
      emit('blur', e)
      radioGroup && radioGroup.onRadioBlur && radioGroup.onRadioBlur(e)
    }

    function onChange () {
      if (isDisabled.value || isReadonly.value) return

      const mandatory = radioGroup && radioGroup.mandatory ? radioGroup.mandatory() : false

      if (!isActive.value || !mandatory) {
        emit('change', props.value)
        radioGroup && radioGroup.onRadioChange && radioGroup.onRadioChange(props.value)
      }
    }

    const { genRipple } = useRippleable(props, { onChange })

    function genInput () {
      const rawAttrs = { ...attrs }
      const { id, ...restAttrs } = rawAttrs
      const name = radioGroup && radioGroup.name ? radioGroup.name() : (radioGroup && radioGroup.uid ? `v-radio-${radioGroup.uid}` : undefined)

      return h('input', {
        ...restAttrs,
        id,
        type: 'radio',
        role: 'radio',
        name,
        value: props.value,
        checked: isActive.value,
        disabled: isDisabled.value,
        readonly: isReadonly.value,
        'aria-checked': String(isActive.value),
        'aria-label': props.label,
        onFocus,
        onBlur,
        onChange,
      })
    }

    function genLabel () {
      const rawAttrs = { ...attrs }
      const id = rawAttrs.id
      const validation = computedColor.value || ''

      if (!slots.label && !props.label) return null

      return h(VLabel, {
        for: id,
        color: validation,
        dark: props.dark,
        focused: hasState.value,
        light: props.light,
        onClick: onChange,
      }, slots.label ? slots.label : () => props.label)
    }

    function genRadio () {
      const rippleColor = computedColor.value || undefined
      const ripple = genRipple(setTextColor(rippleColor))

      const icon = h(VIcon, setTextColor(rippleColor, {
        props: {
          dark: props.dark,
          light: props.light,
        },
      }), { default: () => computedIcon.value })

      return h('div', { class: 'v-input--selection-controls__input' }, [
        genInput(),
        ripple,
        icon,
      ])
    }

    return () => {
      const rawAttrs = { ...attrs }
      const { class: className, style: styleAttr, ...restAttrs } = rawAttrs
      const data = computedData.value

      const finalClass = [data.class, className].filter(Boolean)
      const finalStyle = {
        ...(data.style || {}),
        ...(styleAttr || {}),
      }

      return h('div', {
        ...restAttrs,
        class: finalClass,
        style: finalStyle,
      }, [
        genRadio(),
        genLabel(),
      ])
    }
  },
})
