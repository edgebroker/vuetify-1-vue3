// Styles
import "@/css/vuetify.css"

// Extensions
import VInput from '../VInput'

// Components
import VCounter from '../VCounter'
import VLabel from '../VLabel'

// Composables
import useMaskable from '../../composables/useMaskable'
import useLoadable from '../../composables/useLoadable'

// Directives
import Ripple from '../../directives/ripple'

// Utilities
import {
  keyCodes
} from '../../util/helpers'
import { deprecate } from '../../util/console'

// Types
import { computed, defineComponent, getCurrentInstance, h, nextTick, onMounted, ref, watch } from 'vue'

const dirtyTypes = ['color', 'file', 'time', 'date', 'datetime-local', 'week', 'month']

/* @vue/component */
export default defineComponent({
  name: 'v-text-field',

  extends: VInput,

  directives: { Ripple },

  inheritAttrs: false,

  props: {
    appendOuterIcon: String,
    /** @deprecated */
    appendOuterIconCb: Function,
    autofocus: Boolean,
    box: Boolean,
    browserAutocomplete: String,
    clearable: Boolean,
    clearIcon: {
      type: String,
      default: '$vuetify.icons.clear'
    },
    clearIconCb: Function,
    color: {
      type: String,
      default: 'primary'
    },
    counter: [Boolean, Number, String],
    flat: Boolean,
    fullWidth: Boolean,
    label: String,
    outline: Boolean,
    placeholder: String,
    prefix: String,
    prependInnerIcon: String,
    /** @deprecated */
    prependInnerIconCb: Function,
    reverse: Boolean,
    singleLine: Boolean,
    solo: Boolean,
    soloInverted: Boolean,
    suffix: String,
    type: {
      type: String,
      default: 'text'
    }
  },

  setup (props, context) {
    const { attrs, emit, slots } = context
    const instance = getCurrentInstance()
    const proxy = instance?.proxy

    const maskable = useMaskable(props, context)
    const loadable = useLoadable(props, context)

    const baseGenIcon = proxy && proxy.genIcon ? proxy.genIcon.bind(proxy) : undefined
    const baseGenInputSlot = proxy && proxy.genInputSlot ? proxy.genInputSlot.bind(proxy) : undefined
    const baseGenMessages = proxy && proxy.genMessages ? proxy.genMessages.bind(proxy) : undefined
    const baseGenSlot = proxy && proxy.genSlot ? proxy.genSlot.bind(proxy) : undefined
    const baseOnMouseDown = proxy && proxy.onMouseDown ? proxy.onMouseDown.bind(proxy) : undefined
    const baseOnMouseUp = proxy && proxy.onMouseUp ? proxy.onMouseUp.bind(proxy) : undefined

    const badInput = ref(false)
    const initialValue = ref(null)
    const internalChange = ref(false)
    const isClearing = ref(false)

    const textarea = computed(() => Boolean(attrs.textarea))
    const isSolo = computed(() => props.solo || props.soloInverted)
    const isSingle = computed(() => isSolo.value || props.singleLine)
    const hasOutline = computed(() => props.outline || textarea.value)
    const isEnclosed = computed(() => (
      props.box ||
      isSolo.value ||
      hasOutline.value ||
      props.fullWidth
    ))
    const isDirty = computed(() => {
      const value = maskable.lazyValue?.value
      return (value != null && value.toString().length > 0) || badInput.value
    })
    const isLabelActive = computed(() => isDirty.value || dirtyTypes.includes(props.type))
    const prefixLabel = computed(() => Boolean(props.prefix && !props.value))
    const prefixWidth = computed(() => {
      const prefixRef = proxy?.$refs?.prefix
      if (!props.prefix && !prefixRef) return undefined
      return prefixRef ? prefixRef.offsetWidth : undefined
    })
    const labelValue = computed(() => {
      const focused = proxy?.isFocused
      return !isSingle.value && Boolean(focused || isLabelActive.value || props.placeholder || prefixLabel.value)
    })
    const labelPosition = computed(() => {
      const offset = (props.prefix && !labelValue.value) ? (prefixWidth.value || 0) : 0
      const rtl = proxy?.$vuetify?.rtl
      return (!rtl !== !props.reverse)
        ? { left: 'auto', right: offset }
        : { left: offset, right: 'auto' }
    })
    const hasLabel = computed(() => Boolean(slots.label || props.label))
    const showLabel = computed(() => hasLabel.value && (!isSingle.value || (!isLabelActive.value && !props.placeholder && !prefixLabel.value)))
    const internalValue = computed({
      get () {
        return maskable.lazyValue?.value
      },
      set (val) {
        if (props.mask && maskable.lazyValue && val !== maskable.lazyValue.value) {
          maskable.lazyValue.value = maskable.unmaskText(maskable.maskText(maskable.unmaskText(val)))
          maskable.setSelectionRange()
        } else if (maskable.lazyValue) {
          maskable.lazyValue.value = val
          emit('input', maskable.lazyValue.value)
        }
      }
    })
    const counterValue = computed(() => {
      const value = internalValue.value != null ? internalValue.value : ''
      return value.toString().length
    })
    const directivesInput = computed(() => [])
    const classes = computed(() => ({
      'v-text-field': true,
      'v-text-field--full-width': props.fullWidth,
      'v-text-field--prefix': props.prefix,
      'v-text-field--single-line': isSingle.value,
      'v-text-field--solo': isSolo.value,
      'v-text-field--solo-inverted': props.soloInverted,
      'v-text-field--solo-flat': props.flat,
      'v-text-field--box': props.box,
      'v-text-field--enclosed': isEnclosed.value,
      'v-text-field--reverse': props.reverse,
      'v-text-field--outline': hasOutline.value,
      'v-text-field--placeholder': props.placeholder
    }))

    onMounted(() => {
      if (props.autofocus) {
        proxy?.onFocus?.()
      }
    })

    watch(
      () => proxy?.isFocused,
      val => {
        if (val == null) return

        if (proxy) proxy.hasColor = val

        const lazyValue = maskable.lazyValue
        if (!lazyValue) return

        if (val) {
          initialValue.value = lazyValue.value
        } else if (initialValue.value !== lazyValue.value) {
          emit('change', lazyValue.value)
        }
      }
    )

    watch(
      () => props.value,
      val => {
        const lazyValue = maskable.lazyValue
        if (!lazyValue) return

        if (props.mask && !internalChange.value) {
          const masked = maskable.maskText(maskable.unmaskText(val))
          lazyValue.value = maskable.unmaskText(masked)

          if (String(val) !== lazyValue.value) {
            nextTick(() => {
              const inputEl = maskable.input?.value || proxy?.$refs?.input
              if (inputEl) inputEl.value = masked
              emit('input', lazyValue.value)
            })
          }
        } else {
          lazyValue.value = val
        }
      }
    )

    function focus () {
      onFocus()
    }

    function blur (e) {
      window.requestAnimationFrame(() => {
        const input = maskable.input?.value || proxy?.$refs?.input
        input && typeof input.blur === 'function' && input.blur()
      })
      onBlur(e)
    }

    function clearableCallback () {
      internalValue.value = null
      nextTick(() => {
        const input = maskable.input?.value || proxy?.$refs?.input
        input && typeof input.focus === 'function' && input.focus()
      })
    }

    function genAppendSlot () {
      if (!baseGenSlot) return null
      const slot = []

      if (slots['append-outer']) {
        slot.push(...(slots['append-outer']() || []))
      } else if (props.appendOuterIcon && baseGenIcon) {
        const icon = baseGenIcon('appendOuter')
        if (icon) slot.push(icon)
      }

      return baseGenSlot('append', 'outer', slot)
    }

    function genPrependInnerSlot () {
      if (!baseGenSlot) return null
      const slot = []

      if (slots['prepend-inner']) {
        slot.push(...(slots['prepend-inner']() || []))
      } else if (props.prependInnerIcon && baseGenIcon) {
        const icon = baseGenIcon('prependInner')
        if (icon) slot.push(icon)
      }

      return baseGenSlot('prepend', 'inner', slot)
    }

    function genIconSlot () {
      if (!baseGenSlot) return null
      const slot = []

      if (slots.append) {
        slot.push(...(slots.append() || []))
      } else if (props.appendIcon && baseGenIcon) {
        const icon = baseGenIcon('append')
        if (icon) slot.push(icon)
      }

      return baseGenSlot('append', 'inner', slot)
    }

    function genInputSlot () {
      if (!baseGenInputSlot) return null

      const input = baseGenInputSlot()
      const prepend = genPrependInnerSlot()

      if (!prepend || !input) return input

      const children = Array.isArray(input.children) ? input.children : input.children != null ? [input.children] : []
      children.unshift(prepend)
      input.children = children

      return input
    }

    function genClearIcon () {
      if (!props.clearable) return null

      const icon = !isDirty.value
        ? false
        : 'clear'

      if (props.clearIconCb) deprecate(':clear-icon-cb', '@click:clear', proxy)

      const handler = (!proxy?.$listeners?.['click:clear'] && props.clearIconCb) || clearableCallback

      if (!baseGenSlot || !baseGenIcon) return null

      const iconNode = baseGenIcon(icon, handler, false)
      return iconNode ? baseGenSlot('append', 'inner', [iconNode]) : null
    }

    function genCounter () {
      if (props.counter === false || props.counter == null) return null

      const max = props.counter === true ? attrs.maxlength : props.counter

      return h(VCounter, {
        dark: props.dark,
        light: props.light,
        max,
        value: counterValue.value
      })
    }

    function genDefaultSlot () {
      return [
        genTextFieldSlot(),
        genClearIcon(),
        genIconSlot(),
        loadable.genProgress()
      ]
    }

    function genLabel () {
      if (!showLabel.value) return null

      const data = {
        absolute: true,
        color: proxy?.validationState,
        dark: props.dark,
        disabled: props.disabled,
        focused: !isSingle.value && (proxy?.isFocused || !!proxy?.validationState),
        left: labelPosition.value.left,
        light: props.light,
        right: labelPosition.value.right,
        value: labelValue.value
      }

      if (attrs.id) data.for = attrs.id

      const labelSlot = slots.label
      return h(VLabel, data, labelSlot ? { default: () => labelSlot() } : { default: () => props.label })
    }

    function genInput () {
      const listeners = Object.assign({}, proxy?.$listeners)
      if (listeners && listeners.change) delete listeners.change

      const data = {
        style: {},
        domProps: {
          value: maskable.maskText(maskable.lazyValue?.value)
        },
        attrs: {
          'aria-label': (!attrs || !attrs.id) && props.label,
          ...attrs,
          autofocus: props.autofocus,
          disabled: props.disabled,
          readonly: props.readonly,
          type: props.type
        },
        on: Object.assign({}, listeners, {
          blur,
          input: onInput,
          focus: onFocus,
          keydown: onKeyDown
        }),
        ref: 'input'
      }

      if (props.placeholder) data.attrs.placeholder = props.placeholder
      if (props.mask) data.attrs.maxlength = maskable.masked?.value?.length
      if (props.browserAutocomplete) data.attrs.autocomplete = props.browserAutocomplete

      return h('input', data)
    }

    function genMessages () {
      if (props.hideDetails) return null

      return h('div', {
        staticClass: 'v-text-field__details'
      }, [
        baseGenMessages ? baseGenMessages() : null,
        genCounter()
      ])
    }

    function genTextFieldSlot () {
      return h('div', {
        staticClass: 'v-text-field__slot'
      }, [
        genLabel(),
        props.prefix ? genAffix('prefix') : null,
        genInput(),
        props.suffix ? genAffix('suffix') : null
      ])
    }

    function genAffix (type) {
      return h('div', {
        class: `v-text-field__${type}`,
        ref: type
      }, props[type])
    }

    function onBlur (e) {
      if (proxy) proxy.isFocused = false
      internalChange.value = false

      e && emit('blur', e)
    }

    function onClick () {
      if (proxy?.isFocused || props.disabled) return

      const input = maskable.input?.value || proxy?.$refs?.input
      input && typeof input.focus === 'function' && input.focus()
    }

    function onFocus (e) {
      const input = maskable.input?.value || proxy?.$refs?.input
      if (!input) return

      if (document.activeElement !== input) {
        return input.focus()
      }

      if (!proxy?.isFocused) {
        if (proxy) proxy.isFocused = true
        emit('focus', e)
      }
    }

    function onInput (e) {
      internalChange.value = true
      props.mask && maskable.resetSelections(e.target)
      internalValue.value = e.target.value
      badInput.value = e.target.validity && e.target.validity.badInput
    }

    function onKeyDown (e) {
      internalChange.value = true

      if (e.keyCode === keyCodes.enter) emit('change', internalValue.value)

      emit('keydown', e)
    }

    function onMouseDown (e) {
      const input = maskable.input?.value || proxy?.$refs?.input
      if (e.target !== input) {
        e.preventDefault()
        e.stopPropagation()
      }

      baseOnMouseDown && baseOnMouseDown(e)
    }

    function onMouseUp (e) {
      if (proxy?.hasMouseDown) focus()

      baseOnMouseUp && baseOnMouseUp(e)
    }

    return {
      ...maskable,
      ...loadable,
      badInput,
      initialValue,
      internalChange,
      isClearing,
      classes,
      counterValue,
      directivesInput,
      hasOutline,
      internalValue,
      isDirty,
      isEnclosed,
      isLabelActive,
      isSingle,
      isSolo,
      labelPosition,
      showLabel,
      labelValue,
      prefixWidth,
      prefixLabel,
      textarea,
      blur,
      clearableCallback,
      focus,
      genAffix,
      genAppendSlot,
      genClearIcon,
      genCounter,
      genDefaultSlot,
      genIconSlot,
      genInput,
      genInputSlot,
      genLabel,
      genMessages,
      genPrependInnerSlot,
      genTextFieldSlot,
      onBlur,
      onClick,
      onFocus,
      onInput,
      onKeyDown,
      onMouseDown,
      onMouseUp
    }
  }
})

export function useTextFieldController () {
  const instance = getCurrentInstance()
  const proxy = instance && instance.proxy

  if (!proxy) {
    throw new Error('[Vuetify] useTextFieldController must be called from within setup()')
  }

  const findBaseComponent = () => {
    let component = instance && instance.type
    if (!component) return undefined
    component = component.extends || component.super
    return component
  }

  const findBaseMethod = method => {
    let component = findBaseComponent()

    while (component) {
      const options = component.options || component
      const methods = options && options.methods

      if (methods && typeof methods[method] === 'function') {
        return methods[method]
      }

      component = component.extends || component.super
    }

    return undefined
  }

  const call = method => (...args) => {
    const target = proxy[method]
    return typeof target === 'function' ? target.apply(proxy, args) : undefined
  }

  const callBase = method => (...args) => {
    const target = findBaseMethod(method)
    return typeof target === 'function' ? target.apply(proxy, args) : undefined
  }

  return {
    genInput: call('genInput'),
    genLabel: call('genLabel'),
    onInput: call('onInput'),
    onKeyDown: call('onKeyDown'),
    base: {
      genInput: callBase('genInput'),
      onInput: callBase('onInput'),
      onKeyDown: callBase('onKeyDown')
    }
  }
}
