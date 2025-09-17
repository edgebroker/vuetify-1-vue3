// Styles
import "@/css/vuetify.css"

// Components
import { VScaleTransition } from '../transitions'

// Extensions
import VInput from '../VInput'

// Directives
import ClickOutside from '../../directives/click-outside'

// Utilities
import {
  addOnceEventListener,
  convertToUnit,
  createRange,
  keyCodes,
  deepEqual
} from '../../util/helpers'
import { consoleWarn } from '../../util/console'

// Composables
import useColorable from '../../composables/useColorable'
import useLoadable, { loadableProps } from '../../composables/useLoadable'

// Types
import { defineComponent, ref, getCurrentInstance, computed, h, watch, onMounted, withDirectives, vShow } from 'vue'

/* @vue/component */
export default defineComponent({
  name: 'v-slider',

  extends: VInput,

  directives: { ClickOutside },

  props: {
    alwaysDirty: Boolean,
    inverseLabel: Boolean,
    label: String,
    min: {
      type: [Number, String],
      default: 0
    },
    max: {
      type: [Number, String],
      default: 100
    },
    step: {
      type: [Number, String],
      default: 1
    },
    ticks: {
      type: [Boolean, String],
      default: false,
      validator: v => typeof v === 'boolean' || v === 'always'
    },
    tickLabels: {
      type: Array,
      default: () => ([])
    },
    tickSize: {
      type: [Number, String],
      default: 1
    },
    thumbColor: {
      type: String,
      default: null
    },
    thumbLabel: {
      type: [Boolean, String],
      default: null,
      validator: v => typeof v === 'boolean' || v === 'always'
    },
    thumbSize: {
      type: [Number, String],
      default: 32
    },
    trackColor: {
      type: String,
      default: null
    },
    value: [Number, String],
    ...loadableProps
  },

  setup (props, context) {
    const { attrs, emit, slots, expose } = context
    const { setBackgroundColor, setTextColor } = useColorable(props)
    const { genProgress } = useLoadable(props, context)

    const instance = getCurrentInstance()
    const proxy = instance?.proxy

    const app = ref(null)
    const input = ref(null)
    const track = ref(null)
    const isActive = ref(false)
    const keyPressed = ref(0)
    const lazyValue = ref(typeof props.value !== 'undefined' ? Number(props.value) : Number(props.min))
    const oldValue = ref(null)

    const minValue = computed(() => Number(props.min))
    const maxValue = computed(() => Number(props.max))
    const stepNumeric = computed(() => {
      const step = Number(props.step)
      return step > 0 ? parseFloat(props.step) : 0
    })
    const rtl = computed(() => Boolean(proxy?.$vuetify?.rtl))

    function roundValue (value) {
      if (!stepNumeric.value) return value

      const trimmedStep = props.step.toString().trim()
      const decimals = trimmedStep.indexOf('.') > -1
        ? trimmedStep.length - trimmedStep.indexOf('.') - 1
        : 0
      const offset = minValue.value % stepNumeric.value

      const newValue = Math.round((value - offset) / stepNumeric.value) * stepNumeric.value + offset
      const clamped = Math.max(Math.min(newValue, maxValue.value), minValue.value)

      return parseFloat(clamped.toFixed(decimals))
    }

    const internalValue = computed({
      get () {
        return Number(lazyValue.value)
      },
      set (val) {
        const numericVal = typeof val === 'number' ? val : parseFloat(val)
        if (Number.isNaN(numericVal)) return

        const clamped = Math.min(Math.max(numericVal, minValue.value), maxValue.value)
        const value = roundValue(clamped)

        if (value === lazyValue.value) return

        lazyValue.value = value
        emit('input', value)
        proxy?.validate && proxy.validate()
      }
    })

    const inputWidth = computed(() => {
      const length = maxValue.value - minValue.value
      if (!length) return 0

      const numericValue = Number(internalValue.value)
      if (Number.isNaN(numericValue)) return 0

      return (roundValue(numericValue) - minValue.value) / length * 100
    })

    const trackTransition = computed(() => keyPressed.value >= 2 ? 'none' : '')
    const trackPadding = computed(() => (
      isActive.value ||
      inputWidth.value > 0 ||
      props.disabled
    ) ? 0 : 7)

    const showTicks = computed(() => props.tickLabels.length > 0 || (!props.disabled && stepNumeric.value && !!props.ticks))
    const showThumbLabel = computed(() => !props.disabled && (
      !!props.thumbLabel ||
      props.thumbLabel === '' ||
      Boolean(slots['thumb-label'])
    ))

    const computedColor = computed(() => {
      if (props.disabled) return null
      return proxy?.validationState || props.color || 'primary'
    })

    const computedTrackColor = computed(() => props.disabled ? null : (props.trackColor || null))

    const isDirty = computed(() => Number(internalValue.value) > minValue.value || props.alwaysDirty)

    const computedThumbColor = computed(() => {
      if (props.disabled || !isDirty.value) return null
      return proxy?.validationState || props.thumbColor || props.color || 'primary'
    })

    const trackFillStyles = computed(() => {
      const left = rtl.value ? 'auto' : 0
      const right = rtl.value ? 0 : 'auto'
      let width = `${inputWidth.value}%`

      if (props.disabled) width = `calc(${inputWidth.value}% - 8px)`

      return {
        transition: trackTransition.value,
        left,
        right,
        width
      }
    })

    const trackStyles = computed(() => {
      const padding = props.disabled ? `calc(${inputWidth.value}% + 8px)` : `${trackPadding.value}px`
      const left = rtl.value ? 'auto' : padding
      const right = rtl.value ? padding : 'auto'
      const width = props.disabled
        ? `calc(${100 - inputWidth.value}% - 8px)`
        : '100%'

      return {
        transition: trackTransition.value,
        left,
        right,
        width
      }
    })

    const tickStyles = computed(() => {
      const size = Number(props.tickSize)
      const styles = {
        'border-width': `${size}px`
      }

      styles['border-radius'] = size > 1 ? '50%' : null
      styles.transform = size > 1 ? `translateX(-${size}px) translateY(-${size - 1}px)` : null

      return styles
    })

    const numTicks = computed(() => {
      const step = stepNumeric.value
      if (!step) return 0
      return Math.ceil((maxValue.value - minValue.value) / step)
    })

    const classes = computed(() => ({
      'v-input--slider': true,
      'v-input--slider--ticks': showTicks.value,
      'v-input--slider--inverse-label': props.inverseLabel,
      'v-input--slider--ticks-labels': props.tickLabels.length > 0,
      'v-input--slider--thumb-label': Boolean(props.thumbLabel) || Boolean(slots['thumb-label'])
    }))

    watch(() => props.min, val => {
      const numeric = parseFloat(val)
      if (Number.isNaN(numeric)) return
      if (numeric > Number(internalValue.value)) emit('input', numeric)
    })

    watch(() => props.max, val => {
      const numeric = parseFloat(val)
      if (Number.isNaN(numeric)) return
      if (numeric < Number(internalValue.value)) emit('input', numeric)
    })

    watch(() => props.value, val => {
      if (deepEqual(val, lazyValue.value)) return
      internalValue.value = val
    })

    onMounted(() => {
      const application = document.querySelector('[data-app]')

      if (application) {
        app.value = application
      } else {
        consoleWarn('Missing v-app or a non-body wrapping element with the [data-app] attribute', proxy)
      }
    })

    const baseGenLabel = proxy && typeof proxy.genLabel === 'function'
      ? proxy.genLabel.bind(proxy)
      : undefined

    function getLabel (value) {
      const thumbLabelSlot = slots['thumb-label']
      return thumbLabelSlot
        ? thumbLabelSlot({ value })
        : h('span', value)
    }

    function genThumb () {
      return h('div', setBackgroundColor(computedThumbColor.value, {
        staticClass: 'v-slider__thumb'
      }))
    }

    function genThumbLabel (content) {
      const size = convertToUnit(props.thumbSize)
      const show = Boolean(proxy?.isFocused) || isActive.value || props.thumbLabel === 'always'

      const children = Array.isArray(content) ? content : [content]
      const container = h('div', {
        staticClass: 'v-slider__thumb-label__container'
      }, [
        h('div', setBackgroundColor(computedThumbColor.value, {
          staticClass: 'v-slider__thumb-label',
          style: {
            height: size,
            width: size
          }
        }), children)
      ])

      return h(VScaleTransition, {
        origin: 'bottom center'
      }, [withDirectives(container, [[vShow, show]])])
    }

    function genThumbContainer (value, valueWidth, active, onDrag) {
      const children = [genThumb()]
      const thumbLabelContent = getLabel(value)
      if (showThumbLabel.value) {
        const label = genThumbLabel(thumbLabelContent)
        if (label) children.push(label)
      }

      return h('div', setTextColor(computedThumbColor.value, {
        staticClass: 'v-slider__thumb-container',
        class: {
          'v-slider__thumb-container--is-active': active,
          'v-slider__thumb-container--show-label': showThumbLabel.value
        },
        style: {
          transition: trackTransition.value,
          left: `${rtl.value ? 100 - valueWidth : valueWidth}%`
        },
        on: {
          touchstart: onDrag,
          mousedown: onDrag
        }
      }), children)
    }

    function genTrackContainer () {
      const children = [
        h('div', setBackgroundColor(computedTrackColor.value, {
          staticClass: 'v-slider__track',
          style: trackStyles.value
        })),
        h('div', setBackgroundColor(computedColor.value, {
          staticClass: 'v-slider__track-fill',
          style: trackFillStyles.value
        }))
      ]

      return h('div', {
        staticClass: 'v-slider__track__container',
        ref: track
      }, children)
    }

    function genSteps () {
      if (!props.step || !showTicks.value) return null

      const ticks = createRange(numTicks.value + 1).map(i => {
        const children = []

        if (props.tickLabels[i]) {
          children.push(h('span', props.tickLabels[i]))
        }

        return h('span', {
          key: i,
          staticClass: 'v-slider__ticks',
          class: {
            'v-slider__ticks--always-show': props.ticks === 'always' || props.tickLabels.length > 0
          },
          style: {
            ...tickStyles.value,
            left: `${i * (100 / numTicks.value)}%`
          }
        }, children)
      })

      return h('div', {
        staticClass: 'v-slider__ticks-container'
      }, ticks)
    }

    function genInput () {
      return h('input', {
        attrs: {
          'aria-label': props.label,
          name: props.name,
          role: 'slider',
          tabindex: props.disabled ? -1 : attrs.tabindex,
          value: internalValue.value,
          readonly: true,
          'aria-readonly': String(props.readonly),
          'aria-valuemin': props.min,
          'aria-valuemax': props.max,
          'aria-valuenow': internalValue.value,
          ...attrs
        },
        on: {
          blur: onBlur,
          click: onSliderClick,
          focus: onFocus,
          keydown: onKeyDown,
          keyup: onKeyUp
        },
        ref: input
      })
    }

    function genChildren () {
      return [
        genInput(),
        genTrackContainer(),
        genSteps(),
        genThumbContainer(
          internalValue.value,
          inputWidth.value,
          Boolean(proxy?.isFocused) || isActive.value,
          onThumbMouseDown
        )
      ]
    }

    function genSlider () {
      const sliderNode = h('div', {
        staticClass: 'v-slider',
        class: {
          'v-slider--is-active': isActive.value
        }
      }, genChildren())

      return withDirectives(sliderNode, [[ClickOutside, onBlur]])
    }

    function genDefaultSlot () {
      const children = []
      if (baseGenLabel) children.push(baseGenLabel())

      const slider = genSlider()
      if (props.inverseLabel) children.unshift(slider)
      else children.push(slider)

      children.push(genProgress())

      return children
    }

    function onBlur (e) {
      if (keyPressed.value === 2) return

      isActive.value = false
      if (proxy) proxy.isFocused = false
      emit('blur', e)
    }

    function onFocus (e) {
      if (proxy) proxy.isFocused = true
      emit('focus', e)
    }

    function onThumbMouseDown (e) {
      oldValue.value = internalValue.value
      keyPressed.value = 2
      const options = { passive: true }
      isActive.value = true
      if (proxy) proxy.isFocused = false

      const target = app.value
      if (!target) return

      if ('touches' in e) {
        target.addEventListener('touchmove', onMouseMove, options)
        addOnceEventListener(target, 'touchend', onSliderMouseUp)
      } else {
        target.addEventListener('mousemove', onMouseMove, options)
        addOnceEventListener(target, 'mouseup', onSliderMouseUp)
      }

      emit('start', internalValue.value)
    }

    function onSliderMouseUp () {
      keyPressed.value = 0
      const options = { passive: true }
      isActive.value = false
      if (proxy) proxy.isFocused = false

      const target = app.value
      if (target) {
        target.removeEventListener('touchmove', onMouseMove, options)
        target.removeEventListener('mousemove', onMouseMove, options)
      }

      emit('end', internalValue.value)
      if (!deepEqual(oldValue.value, internalValue.value)) {
        emit('change', internalValue.value)
      }
    }

    function onMouseMove (e) {
      const { value, isInsideTrack } = parseMouseMove(e)

      if (isInsideTrack) {
        setInternalValue(value)
      }
    }

    function onKeyDown (e) {
      if (props.disabled || props.readonly) return

      const value = parseKeyDown(e)

      if (value == null) return

      setInternalValue(value)
      emit('change', value)
    }

    function onKeyUp () {
      keyPressed.value = 0
    }

    function onSliderClick (e) {
      if (proxy) proxy.isFocused = true
      onMouseMove(e)
      emit('change', internalValue.value)
    }

    function parseMouseMove (e) {
      const trackEl = track.value
      if (!trackEl) {
        return { value: internalValue.value, isInsideTrack: false }
      }

      const { left: offsetLeft, width: trackWidth } = trackEl.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX

      if (!trackWidth) {
        return { value: internalValue.value, isInsideTrack: false }
      }

      let left = Math.min(Math.max((clientX - offsetLeft) / trackWidth, 0), 1) || 0

      if (rtl.value) left = 1 - left

      const isInsideTrack = clientX >= offsetLeft - 8 && clientX <= offsetLeft + trackWidth + 8
      const value = minValue.value + left * (maxValue.value - minValue.value)

      return { value, isInsideTrack }
    }

    function parseKeyDown (e, value = internalValue.value) {
      if (props.disabled) return

      const { pageup, pagedown, end, home, left, right, down, up } = keyCodes

      if (![pageup, pagedown, end, home, left, right, down, up].includes(e.keyCode)) return

      e.preventDefault()
      const step = stepNumeric.value || 1
      const steps = (maxValue.value - minValue.value) / step

      if ([left, right, down, up].includes(e.keyCode)) {
        keyPressed.value += 1

        const increase = rtl.value ? [left, up] : [right, up]
        const direction = increase.includes(e.keyCode) ? 1 : -1
        const multiplier = e.shiftKey ? 3 : (e.ctrlKey ? 2 : 1)

        value = Number(value) + (direction * step * multiplier)
      } else if (e.keyCode === home) {
        value = minValue.value
      } else if (e.keyCode === end) {
        value = maxValue.value
      } else {
        const direction = e.keyCode === pagedown ? 1 : -1
        value = Number(value) - (direction * step * (steps > 100 ? steps / 10 : 10))
      }

      return value
    }

    function setInternalValue (value) {
      internalValue.value = value
    }

    const exposed = {
      classes,
      trackFillStyles,
      trackPadding,
      genDefaultSlot,
      genSlider,
      genChildren,
      genInput,
      genTrackContainer,
      genSteps,
      genThumb,
      genThumbContainer,
      genThumbLabel,
      getLabel,
      onBlur,
      onFocus,
      onThumbMouseDown,
      onSliderMouseUp,
      onMouseMove,
      onKeyDown,
      onKeyUp,
      onSliderClick,
      parseMouseMove,
      parseKeyDown,
      roundValue,
      setInternalValue
    }

    expose(exposed)

    return {
      setBackgroundColor,
      setTextColor,
      genProgress,
      app,
      input,
      track,
      isActive,
      keyPressed,
      lazyValue,
      oldValue,
      minValue,
      maxValue,
      stepNumeric,
      rtl,
      roundValue,
      internalValue,
      inputWidth,
      trackTransition,
      trackPadding,
      showTicks,
      showThumbLabel,
      computedColor,
      computedTrackColor,
      computedThumbColor,
      trackFillStyles,
      trackStyles,
      tickStyles,
      numTicks,
      isDirty,
      classes,
      genDefaultSlot,
      genSlider,
      genChildren,
      genInput,
      genTrackContainer,
      genSteps,
      genThumb,
      genThumbContainer,
      genThumbLabel,
      getLabel,
      onBlur,
      onFocus,
      onThumbMouseDown,
      onSliderMouseUp,
      onMouseMove,
      onKeyDown,
      onKeyUp,
      onSliderClick,
      parseMouseMove,
      parseKeyDown,
      setInternalValue
    }
  }
})

export function useSliderController () {
  const instance = getCurrentInstance()
  const proxy = instance && instance.proxy

  if (!proxy) {
    throw new Error('[Vuetify] useSliderController must be called from within setup()')
  }

  const exposed = instance && instance.exposed

  const getExposed = key => exposed && exposed[key]

  const getRef = key => {
    const exposedValue = getExposed(key)
    if (exposedValue !== undefined) return exposedValue
    return proxy[key]
  }

  const createHandler = key => {
    const exposedHandler = getExposed(key)
    if (typeof exposedHandler === 'function') {
      return exposedHandler
    }

    const target = proxy && proxy[key]
    if (typeof target === 'function') {
      return (...args) => target.apply(proxy, args)
    }

    return undefined
  }

  return {
    classes: getRef('classes'),
    trackFillStyles: getRef('trackFillStyles'),
    trackPadding: getRef('trackPadding'),
    genInput: createHandler('genInput'),
    genTrackContainer: createHandler('genTrackContainer'),
    genSteps: createHandler('genSteps'),
    genThumbContainer: createHandler('genThumbContainer'),
    onFocus: createHandler('onFocus'),
    onThumbMouseDown: createHandler('onThumbMouseDown'),
    parseMouseMove: createHandler('parseMouseMove'),
    parseKeyDown: createHandler('parseKeyDown')
  }
}
