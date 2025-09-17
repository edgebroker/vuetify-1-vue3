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
import { computed, defineComponent, getCurrentInstance, ref } from 'vue'

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
      textarea
    }
  },

  watch: {
    isFocused (val) {
      // Sets validationState from validatable
      this.hasColor = val

      if (val) {
        this.initialValue = this.lazyValue
      } else if (this.initialValue !== this.lazyValue) {
        this.$emit('change', this.lazyValue)
      }
    },
    value (val) {
      if (this.mask && !this.internalChange) {
        const masked = this.maskText(this.unmaskText(val))
        this.lazyValue = this.unmaskText(masked)

        // Emit when the externally set value was modified internally
        String(val) !== this.lazyValue && this.$nextTick(() => {
          this.$refs.input.value = masked
          this.$emit('input', this.lazyValue)
        })
      } else this.lazyValue = val
    }
  },

  mounted () {
    this.autofocus && this.onFocus()
  },

  methods: {
    /** @public */
    focus () {
      this.onFocus()
    },
    /** @public */
    blur (e) {
      // https://github.com/vuetifyjs/vuetify/issues/5913
      // Safari tab order gets broken if called synchronous
      window.requestAnimationFrame(() => {
        this.$refs.input && this.$refs.input.blur()
      })
      this.onBlur(e)
    },
    clearableCallback () {
      this.internalValue = null
      this.$nextTick(() => this.$refs.input.focus())
    },
    genAppendSlot () {
      const slot = []

      if (this.$slots['append-outer']) {
        slot.push(this.$slots['append-outer'])
      } else if (this.appendOuterIcon) {
        slot.push(this.genIcon('appendOuter'))
      }

      return this.genSlot('append', 'outer', slot)
    },
    genPrependInnerSlot () {
      const slot = []

      if (this.$slots['prepend-inner']) {
        slot.push(this.$slots['prepend-inner'])
      } else if (this.prependInnerIcon) {
        slot.push(this.genIcon('prependInner'))
      }

      return this.genSlot('prepend', 'inner', slot)
    },
    genIconSlot () {
      const slot = []

      if (this.$slots['append']) {
        slot.push(this.$slots['append'])
      } else if (this.appendIcon) {
        slot.push(this.genIcon('append'))
      }

      return this.genSlot('append', 'inner', slot)
    },
    genInputSlot () {
      const input = VInput.options.methods.genInputSlot.call(this)

      const prepend = this.genPrependInnerSlot()
      prepend && input.children.unshift(prepend)

      return input
    },
    genClearIcon () {
      if (!this.clearable) return null

      const icon = !this.isDirty
        ? false
        : 'clear'

      if (this.clearIconCb) deprecate(':clear-icon-cb', '@click:clear', this)

      return this.genSlot('append', 'inner', [
        this.genIcon(
          icon,
          (!this.$listeners['click:clear'] && this.clearIconCb) || this.clearableCallback,
          false
        )
      ])
    },
    genCounter () {
      if (this.counter === false || this.counter == null) return null

      const max = this.counter === true ? this.$attrs.maxlength : this.counter

      return this.$createElement(VCounter, {
        props: {
          dark: this.dark,
          light: this.light,
          max,
          value: this.counterValue
        }
      })
    },
    genDefaultSlot () {
      return [
        this.genTextFieldSlot(),
        this.genClearIcon(),
        this.genIconSlot(),
        this.genProgress()
      ]
    },
    genLabel () {
      if (!this.showLabel) return null

      const data = {
        props: {
          absolute: true,
          color: this.validationState,
          dark: this.dark,
          disabled: this.disabled,
          focused: !this.isSingle && (this.isFocused || !!this.validationState),
          left: this.labelPosition.left,
          light: this.light,
          right: this.labelPosition.right,
          value: this.labelValue
        }
      }

      if (this.$attrs.id) data.props.for = this.$attrs.id

      return this.$createElement(VLabel, data, this.$slots.label || this.label)
    },
    genInput () {
      const listeners = Object.assign({}, this.$listeners)
      delete listeners['change'] // Change should not be bound externally

      const data = {
        style: {},
        domProps: {
          value: this.maskText(this.lazyValue)
        },
        attrs: {
          'aria-label': (!this.$attrs || !this.$attrs.id) && this.label, // Label `for` will be set if we have an id
          ...this.$attrs,
          autofocus: this.autofocus,
          disabled: this.disabled,
          readonly: this.readonly,
          type: this.type
        },
        on: Object.assign(listeners, {
          blur: this.onBlur,
          input: this.onInput,
          focus: this.onFocus,
          keydown: this.onKeyDown
        }),
        ref: 'input'
      }

      if (this.placeholder) data.attrs.placeholder = this.placeholder
      if (this.mask) data.attrs.maxlength = this.masked.length
      if (this.browserAutocomplete) data.attrs.autocomplete = this.browserAutocomplete

      return this.$createElement('input', data)
    },
    genMessages () {
      if (this.hideDetails) return null

      return this.$createElement('div', {
        staticClass: 'v-text-field__details'
      }, [
        VInput.options.methods.genMessages.call(this),
        this.genCounter()
      ])
    },
    genTextFieldSlot () {
      return this.$createElement('div', {
        staticClass: 'v-text-field__slot'
      }, [
        this.genLabel(),
        this.prefix ? this.genAffix('prefix') : null,
        this.genInput(),
        this.suffix ? this.genAffix('suffix') : null
      ])
    },
    genAffix (type) {
      return this.$createElement('div', {
        'class': `v-text-field__${type}`,
        ref: type
      }, this[type])
    },
    onBlur (e) {
      this.isFocused = false
      // Reset internalChange state
      // to allow external change
      // to persist
      this.internalChange = false

      e && this.$emit('blur', e)
    },
    onClick () {
      if (this.isFocused || this.disabled) return

      this.$refs.input.focus()
    },
    onFocus (e) {
      if (!this.$refs.input) return

      if (document.activeElement !== this.$refs.input) {
        return this.$refs.input.focus()
      }

      if (!this.isFocused) {
        this.isFocused = true
        this.$emit('focus', e)
      }
    },
    onInput (e) {
      this.internalChange = true
      this.mask && this.resetSelections(e.target)
      this.internalValue = e.target.value
      this.badInput = e.target.validity && e.target.validity.badInput
    },
    onKeyDown (e) {
      this.internalChange = true

      if (e.keyCode === keyCodes.enter) this.$emit('change', this.internalValue)

      this.$emit('keydown', e)
    },
    onMouseDown (e) {
      // Prevent input from being blurred
      if (e.target !== this.$refs.input) {
        e.preventDefault()
        e.stopPropagation()
      }

      VInput.options.methods.onMouseDown.call(this, e)
    },
    onMouseUp (e) {
      if (this.hasMouseDown) this.focus()

      VInput.options.methods.onMouseUp.call(this, e)
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
