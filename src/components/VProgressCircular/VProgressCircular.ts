import "@/css/vuetify.css"

// Composables
import useColorable from '../../composables/useColorable'

// Types
import { defineComponent, computed, h, useAttrs } from 'vue'
import { PropType } from 'vue'

export default defineComponent({
  name: 'v-progress-circular',

  props: {
    button: Boolean,

    indeterminate: Boolean,

    rotate: {
      type: [Number, String] as PropType<number | string>,
      default: 0,
    },

    size: {
      type: [Number, String] as PropType<number | string>,
      default: 32,
    },

    width: {
      type: [Number, String] as PropType<number | string>,
      default: 4,
    },

    value: {
      type: [Number, String] as PropType<number | string>,
      default: 0,
    },

    color: String,
  },

  setup (props, { slots }) {
    const attrs = useAttrs()
    const { setTextColor } = useColorable(props)

    const sizeNumber = computed(() => Number(props.size))
    const widthNumber = computed(() => Number(props.width))
    const rotateNumber = computed(() => Number(props.rotate))

    const calculatedSize = computed(() => sizeNumber.value + (props.button ? 8 : 0))
    const radius = 20
    const circumference = computed(() => 2 * Math.PI * radius)

    const classes = computed(() => ({
      'v-progress-circular--indeterminate': props.indeterminate,
      'v-progress-circular--button': props.button,
    }))

    const normalizedValue = computed(() => {
      const parsed = parseFloat(String(props.value))

      if (parsed < 0) return 0
      if (parsed > 100) return 100

      return isNaN(parsed) ? 0 : parsed
    })

    const viewBoxSize = computed(() => {
      const size = sizeNumber.value || 1
      return radius / (1 - widthNumber.value / size)
    })

    const strokeDashArray = computed(() => Math.round(circumference.value * 1000) / 1000)
    const strokeDashOffset = computed(() => `${((100 - normalizedValue.value) / 100) * circumference.value}px`)
    const strokeWidth = computed(() => (widthNumber.value / (sizeNumber.value || 1)) * viewBoxSize.value * 2)

    const styles = computed(() => ({
      height: `${calculatedSize.value}px`,
      width: `${calculatedSize.value}px`,
    }))

    const svgStyles = computed(() => ({
      transform: `rotate(${rotateNumber.value}deg)`,
    }))

    function genCircle (name: string, offset: string | number) {
      const data: Record<string, any> = {
        class: `v-progress-circular__${name}`,
        fill: 'transparent',
        cx: 2 * viewBoxSize.value,
        cy: 2 * viewBoxSize.value,
        r: radius,
        'stroke-width': strokeWidth.value,
        'stroke-dasharray': strokeDashArray.value,
        'stroke-dashoffset': offset,
      }

      return h('circle', data)
    }

    function genSvg () {
      const children = [
        props.indeterminate ? null : genCircle('underlay', 0),
        genCircle('overlay', strokeDashOffset.value),
      ]

      return h('svg', {
        style: svgStyles.value,
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: `${viewBoxSize.value} ${viewBoxSize.value} ${2 * viewBoxSize.value} ${2 * viewBoxSize.value}`,
      }, children)
    }

    return () => {
      const slotContent = slots.default?.()
      const info = h('div', { class: 'v-progress-circular__info' }, slotContent)
      const svg = genSvg()

      const { class: className, style: styleAttr, ...restAttrs } = attrs as Record<string, any>
      const colorData = setTextColor(props.color)

      const finalClass = [
        'v-progress-circular',
        classes.value,
        colorData.class,
        className,
      ]

      const finalStyle = {
        ...styles.value,
        ...(colorData.style || {}),
        ...(styleAttr as Record<string, any> || {}),
      }

      return h('div', {
        ...restAttrs,
        class: finalClass,
        style: finalStyle,
        role: 'progressbar',
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-valuenow': props.indeterminate ? undefined : normalizedValue.value,
      }, [svg, info])
    }
  },
})
