// Styles
import "@/css/vuetify.css"

// Extensions
import VSlider, { useSliderController } from '../VSlider'

// Utilities
import { createRange, deepEqual } from '../../util/helpers'

// Types
import { defineComponent, ref, computed, watch, getCurrentInstance } from 'vue'

export default defineComponent({
  name: 'v-range-slider',

  extends: VSlider,

  props: {
    value: {
      type: Array,
      default: () => ([]),
    },
  },

  setup (props, { emit }) {
    const vm = getCurrentInstance()
    const proxy = vm && vm.proxy

    if (!proxy) {
      throw new Error('[Vuetify] v-range-slider must be used within a setup context')
    }

    const activeThumb = ref(null)
    const lazyValue = ref((props.value && props.value.length) ? props.value.slice() : [0, 0])

    const {
      classes: baseClasses,
      trackFillStyles: baseTrackFillStyles,
      trackPadding: baseTrackPadding,
      genInput: baseGenInput,
      genTrackContainer: baseGenTrackContainer,
      genSteps: baseGenSteps,
      genThumbContainer: baseGenThumbContainer,
      onFocus: baseOnFocus,
      onThumbMouseDown: baseOnThumbMouseDown,
      parseMouseMove,
      parseKeyDown
    } = useSliderController()

    watch(() => props.value, val => {
      if (!val || !val.length) {
        lazyValue.value = [0, 0]
      } else if (!deepEqual(val, lazyValue.value)) {
        lazyValue.value = val.slice()
      }
    })

    const internalValue = computed({
      get: () => lazyValue.value,
      set: val => {
        const min = Number(proxy.min)
        const max = Number(proxy.max)
        let value = val.map(v => proxy.roundValue(Math.min(Math.max(Number(v), min), max)))

        if (value[0] > value[1] || value[1] < value[0]) {
          if (activeThumb.value !== null) activeThumb.value = activeThumb.value === 1 ? 0 : 1
          value = [value[1], value[0]]
        }

        lazyValue.value = value
        if (!deepEqual(value, props.value)) emit('input', value)
        proxy.validate && proxy.validate()
      },
    })

    const inputWidth = computed(() => {
      const min = Number(proxy.min)
      const max = Number(proxy.max)
      const length = max - min || 1
      return internalValue.value.map(v => ((proxy.roundValue(v) - min) / length) * 100)
    })

    const isDirty = computed(() => {
      const min = Number(proxy.min)
      return internalValue.value.some(v => v !== min) || proxy.alwaysDirty
    })

    const classes = computed(() => ({
      'v-input--range-slider': true,
      ...(baseClasses ? baseClasses.value : {})
    }))

    const trackFillStyles = computed(() => {
      const styles = { ...(baseTrackFillStyles ? baseTrackFillStyles.value : {}) }
      const fillPercent = Math.abs(inputWidth.value[0] - inputWidth.value[1])
      styles.width = `calc(${fillPercent}% - ${proxy.trackPadding}px)`
      styles[proxy.$vuetify.rtl ? 'right' : 'left'] = `${inputWidth.value[0]}%`
      return styles
    })

    const trackPadding = computed(() => {
      if (isDirty.value || internalValue.value[0]) return 0
      return baseTrackPadding ? baseTrackPadding.value : 0
    })

    function getIndexOfClosestValue (arr, v) {
      return Math.abs(arr[0] - v) < Math.abs(arr[1] - v) ? 0 : 1
    }

    function genInput () {
      return createRange(2).map(i => {
        const input = baseGenInput ? baseGenInput() : null
        if (!input) return input
        input.data = input.data || {}
        input.data.attrs = { ...(input.data.attrs || {}), value: internalValue.value[i] }
        input.data.on = { ...(input.data.on || {}), focus: e => {
          activeThumb.value = i
          baseOnFocus && baseOnFocus(e)
        } }
        return input
      })
    }

    function genChildren () {
      return [
        genInput(),
        baseGenTrackContainer ? baseGenTrackContainer() : null,
        baseGenSteps ? baseGenSteps() : null,
        createRange(2).map(i => {
          const value = internalValue.value[i]
          const onDrag = e => {
            proxy.isActive = true
            activeThumb.value = i
            baseOnThumbMouseDown && baseOnThumbMouseDown(e)
          }
          const valueWidth = inputWidth.value[i]
          const isActiveThumb = (proxy.isFocused || proxy.isActive) && activeThumb.value === i
          return baseGenThumbContainer
            ? baseGenThumbContainer(value, valueWidth, isActiveThumb, onDrag)
            : null
        }),
      ]
    }

    function onSliderClick (e) {
      if (!proxy.isActive) {
        proxy.isFocused = true
        onMouseMove(e, true)
        emit('change', internalValue.value)
      }
    }

    function onMouseMove (e, trackClick = false) {
      const parsed = parseMouseMove ? parseMouseMove(e) : { value: null, isInsideTrack: false }
      const { value, isInsideTrack } = parsed

      if (isInsideTrack) {
        if (trackClick) activeThumb.value = getIndexOfClosestValue(internalValue.value, value)
        setInternalValue(value)
      }
    }

    function onKeyDown (e) {
      const value = parseKeyDown
        ? parseKeyDown(e, internalValue.value[activeThumb.value])
        : undefined
      if (value == null) return
      setInternalValue(value)
    }

    function setInternalValue (value) {
      internalValue.value = internalValue.value.map((v, i) => {
        return i === activeThumb.value ? value : Number(v)
      })
    }

    return {
      activeThumb,
      lazyValue,
      internalValue,
      inputWidth,
      isDirty,
      classes,
      trackFillStyles,
      trackPadding,
      getIndexOfClosestValue,
      genInput,
      genChildren,
      onSliderClick,
      onMouseMove,
      onKeyDown,
      setInternalValue,
    }
  },
})
