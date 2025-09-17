import "@/css/vuetify.css"

// Helpers
import { convertToUnit } from '../../util/helpers'

// Composables
import useColorable from '../../composables/useColorable'

// Types
import { defineComponent, computed, h, useAttrs } from 'vue'
import { PropType } from 'vue'

import {
  VFadeTransition,
  VSlideXTransition,
} from '../transitions'

export default defineComponent({
  name: 'v-progress-linear',

  props: {
    active: {
      type: Boolean,
      default: true,
    },
    backgroundColor: {
      type: String,
      default: null,
    },
    backgroundOpacity: {
      type: [Number, String] as PropType<number | string>,
      default: null,
    },
    bufferValue: {
      type: [Number, String] as PropType<number | string>,
      default: 100,
    },
    color: {
      type: String,
      default: 'primary',
    },
    height: {
      type: [Number, String] as PropType<number | string>,
      default: 7,
    },
    indeterminate: Boolean,
    query: Boolean,
    value: {
      type: [Number, String] as PropType<number | string>,
      default: 0,
    },
  },

  setup (props, { slots }) {
    const attrs = useAttrs()
    const { setBackgroundColor } = useColorable(props)

    const normalizedBuffer = computed(() => {
      const parsed = parseFloat(String(props.bufferValue))
      if (parsed < 0) return 0
      if (parsed > 100) return 100
      return isNaN(parsed) ? 0 : parsed
    })

    const normalizedValue = computed(() => {
      const parsed = parseFloat(String(props.value))
      if (parsed < 0) return 0
      if (parsed > 100) return 100
      return isNaN(parsed) ? 0 : parsed
    })

    const effectiveWidth = computed(() => {
      if (!normalizedBuffer.value) return 0
      return (normalizedValue.value * 100) / normalizedBuffer.value
    })

    const backgroundStyle = computed(() => {
      const backgroundOpacity = props.backgroundOpacity == null
        ? (props.backgroundColor ? 1 : 0.3)
        : parseFloat(String(props.backgroundOpacity))

      return {
        height: props.active ? convertToUnit(props.height) : 0,
        opacity: backgroundOpacity,
        width: `${normalizedBuffer.value}%`,
      }
    })

    const styles = computed(() => {
      const style: Record<string, any> = {}
      if (!props.active) {
        style.height = 0
      }
      if (!props.indeterminate && parseFloat(String(normalizedBuffer.value)) !== 100) {
        style.width = `${normalizedBuffer.value}%`
      }
      return style
    })

    function genDeterminate () {
      return h('div', setBackgroundColor(props.color, {
        class: 'v-progress-linear__bar__determinate',
        style: { width: `${effectiveWidth.value}%` },
      }))
    }

    function genBar (name: string) {
      return h('div', setBackgroundColor(props.color, {
        class: {
          'v-progress-linear__bar__indeterminate': true,
          [name]: true,
        },
      }))
    }

    function genIndeterminate () {
      return h('div', {
        class: {
          'v-progress-linear__bar__indeterminate': true,
          'v-progress-linear__bar__indeterminate--active': props.active,
        },
      }, [
        genBar('long'),
        genBar('short'),
      ])
    }

    return () => {
      const fade = h(VFadeTransition, {}, {
        default: () => props.indeterminate ? [genIndeterminate()] : [],
      })
      const slide = h(VSlideXTransition, {}, {
        default: () => props.indeterminate ? [] : [genDeterminate()],
      })

      const bar = h('div', {
        class: 'v-progress-linear__bar',
        style: styles.value,
      }, [fade, slide])

      const background = h('div', setBackgroundColor(props.backgroundColor || props.color, {
        class: 'v-progress-linear__background',
        style: backgroundStyle.value,
      }))

      const content = slots.default ? h('div', { class: 'v-progress-linear__content' }, slots.default()) : null

      const { class: className, style: styleAttr, ...restAttrs } = attrs as Record<string, any>

      const heightStyle = convertToUnit(props.height)

      return h('div', {
        ...restAttrs,
        class: [
          'v-progress-linear',
          { 'v-progress-linear--query': props.query },
          className,
        ],
        style: {
          height: heightStyle,
          ...(styleAttr as Record<string, any> || {}),
        },
        role: 'progressbar',
        'aria-valuemin': 0,
        'aria-valuemax': normalizedBuffer.value,
        'aria-valuenow': props.indeterminate ? undefined : normalizedValue.value,
      }, [
        background,
        bar,
        content,
      ])
    }
  },
})
