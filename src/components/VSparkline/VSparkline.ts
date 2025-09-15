import '@/css/vuetify.css'

import useColorable from '../../composables/useColorable'

import { genPoints } from './helpers/core'
import { genPath } from './helpers/path'

import { defineComponent, h, ref, computed, watch, nextTick, getCurrentInstance, PropType } from 'vue'

export type SparklineItem = number | { value: number }

export type SparklineText = {
  x: number
  value: string
}

export interface Boundary {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface Point {
  x: number
  y: number
  value: number
}

export interface BarText {
  points: Point[]
  boundary: Boundary
  offsetX: number
  lineWidth: number
}

export default defineComponent({
  name: 'v-sparkline',

  props: {
    autoDraw: Boolean,
    autoDrawDuration: {
      type: Number,
      default: 2000
    },
    autoDrawEasing: {
      type: String,
      default: 'ease'
    },
    autoLineWidth: {
      type: Boolean,
      default: false
    },
    color: {
      type: String,
      default: 'primary'
    },
    fill: {
      type: Boolean,
      default: false
    },
    gradient: {
      type: Array as PropType<string[]>,
      default: () => ([])
    },
    gradientDirection: {
      type: String as PropType<'top' | 'bottom' | 'left' | 'right'>,
      validator: (val: string) => ['top', 'bottom', 'left', 'right'].includes(val),
      default: 'top'
    },
    height: {
      type: [String, Number],
      default: 75
    },
    labels: {
      type: Array as PropType<SparklineItem[]>,
      default: () => ([])
    },
    lineWidth: {
      type: [String, Number],
      default: 4
    },
    padding: {
      type: [String, Number],
      default: 8
    },
    smooth: {
      type: [Boolean, Number, String],
      default: false
    },
    showLabels: Boolean,
    type: {
      type: String as PropType<'trend' | 'bar'>,
      default: 'trend',
      validator: (val: string) => ['trend', 'bar'].includes(val)
    },
    value: {
      type: Array as PropType<SparklineItem[]>,
      default: () => ([])
    },
    width: {
      type: [Number, String],
      default: 300
    },
    labelSize: {
      type: [Number, String],
      default: 7
    }
  },

  setup (props, { slots }) {
    const { setTextColor } = useColorable(props)

    const uid = getCurrentInstance()?.uid ?? 0
    const lastLength = ref(0)
    const path = ref<SVGPathElement | null>(null)

    const parsedPadding = computed(() => Number(props.padding))
    const parsedWidth = computed(() => Number(props.width))
    const totalBars = computed(() => props.value.length)

    const lineWidth = computed(() => {
      if (props.autoLineWidth && props.type !== 'trend') {
        const totalPadding = parsedPadding.value * (totalBars.value + 1)
        return (parsedWidth.value - totalPadding) / (totalBars.value || 1)
      } else {
        return Number(props.lineWidth) || 4
      }
    })

    const boundary = computed<Boundary>(() => {
      const height = Number(props.height)

      return {
        minX: parsedPadding.value,
        minY: parsedPadding.value,
        maxX: parsedWidth.value - parsedPadding.value,
        maxY: height - parsedPadding.value
      }
    })

    const hasLabels = computed(() => Boolean(
      props.showLabels ||
      props.labels.length > 0 ||
      slots.label
    ))

    const points = computed<Point[]>(() => genPoints(props.value.slice(), boundary.value, props.type))

    const parsedLabels = computed<SparklineText[]>(() => {
      const labels: SparklineText[] = []
      const pts = points.value
      const len = pts.length

      for (let i = 0; labels.length < len; i++) {
        const item = pts[i]
        let value: any = props.labels[i]

        if (!value) {
          value = (item as any) === Object(item)
            ? (item as any).value
            : item
        }

        labels.push({
          ...item,
          value: String(value)
        })
      }

      return labels
    })

    const textY = computed(() => boundary.value.maxY + 6)

    watch(() => props.value, () => {
      nextTick(() => {
        if (!props.autoDraw || props.type === 'bar') return
        const el = path.value
        if (!el) return

        const length = el.getTotalLength()

        if (!props.fill) {
          el.style.transition = 'none'
          el.style.strokeDasharray = `${length} ${length}`
          el.style.strokeDashoffset = Math.abs(length - (lastLength.value || 0)).toString()
          el.getBoundingClientRect()
          el.style.transition = `stroke-dashoffset ${props.autoDrawDuration}ms ${props.autoDrawEasing}`
          el.style.strokeDashoffset = '0'
        } else {
          el.style.transformOrigin = 'bottom center'
          el.style.transition = 'none'
          el.style.transform = 'scaleY(0)'
          el.getBoundingClientRect()
          el.style.transition = `transform ${props.autoDrawDuration}ms ${props.autoDrawEasing}`
          el.style.transform = 'scaleY(1)'
        }

        lastLength.value = length
      })
    }, { immediate: true, deep: true })

    function genGradient () {
      const gradientDirection = props.gradientDirection
      const gradient = props.gradient.slice()

      if (!gradient.length) gradient.push('')

      const len = Math.max(gradient.length - 1, 1)
      const stops = gradient.reverse().map((color, index) =>
        h('stop', {
          offset: index / len,
          'stop-color': color || props.color || 'currentColor'
        })
      )

      return h('defs', [
        h('linearGradient', {
          id: String(uid),
          x1: Number(gradientDirection === 'left'),
          y1: Number(gradientDirection === 'top'),
          x2: Number(gradientDirection === 'right'),
          y2: Number(gradientDirection === 'bottom')
        }, stops)
      ])
    }

    function genG (children) {
      return h('g', {
        style: {
          fontSize: '8',
          textAnchor: 'middle',
          dominantBaseline: 'mathematical',
          fill: props.color || 'currentColor'
        }
      }, children)
    }

    function genLabels () {
      if (!hasLabels.value) return undefined

      return genG(parsedLabels.value.map(genText))
    }

    function genPathNode () {
      const radius = props.smooth === true ? 8 : Number(props.smooth)

      return h('path', {
        id: String(uid),
        d: genPath(points.value.slice(), radius, props.fill, Number(props.height)),
        fill: props.fill ? `url(#${uid})` : 'none',
        stroke: props.fill ? 'none' : `url(#${uid})`,
        ref: path
      })
    }

    function genText (item: SparklineText, index: number) {
      const slot = slots.label?.({ index, value: item.value })
      const children = slot ?? [item.value]

      return h('text', {
        x: item.x,
        y: textY.value
      }, children)
    }

    function genClipPath (clipPoints: Point[], offsetX: number, width: number, id: string) {
      const { maxY } = boundary.value
      const rounding = typeof props.smooth === 'number'
        ? Number(props.smooth)
        : props.smooth ? 2 : 0

      return h('clipPath', { id: `${id}-clip` }, clipPoints.map(item => {
        const children = [] as any[]

        if (props.autoDraw) {
          children.push(h('animate', {
            attributeName: 'height',
            from: 0,
            to: maxY - item.y,
            dur: `${props.autoDrawDuration}ms`,
            fill: 'freeze'
          }))
        }

        return h('rect', {
          x: item.x + offsetX,
          y: 0,
          width,
          height: Math.max(maxY - item.y, 0),
          rx: rounding,
          ry: rounding
        }, children)
      }))
    }

    function genBarLabels (data: BarText) {
      const offsetX = data.offsetX || 0

      const children = data.points.map(item => (
        h('text', {
          x: item.x + offsetX + (data.lineWidth || 0) / 2,
          y: data.boundary.maxY + (Number(props.labelSize) || 7),
          'font-size': Number(props.labelSize) || 7
        }, item.value.toString())
      ))

      return genG(children)
    }

    function genBar () {
      if (!props.value || totalBars.value < 2) return undefined

      const viewWidth = Number(props.width) || (totalBars.value * parsedPadding.value * 2)
      const viewHeight = Number(props.height) || 75
      const barBoundary: Boundary = {
        minX: parsedPadding.value,
        minY: parsedPadding.value,
        maxX: Number(viewWidth) - parsedPadding.value,
        maxY: Number(viewHeight) - parsedPadding.value
      }
      const barPoints = genPoints(props.value.slice(), barBoundary, props.type)
      const totalWidth = barBoundary.maxX / (barPoints.length - 1 || 1)
      const width = lineWidth.value || (totalWidth - Number(parsedPadding.value || 5))
      let offsetX = 0
      if (!props.autoLineWidth) {
        offsetX = ((barBoundary.maxX / totalBars.value) / 2) - barBoundary.minX
      }

      return h('svg', {
        width: '100%',
        height: '25%',
        viewBox: `0 0 ${viewWidth} ${viewHeight}`
      }, [
        genGradient(),
        genClipPath(barPoints, offsetX, width, `sparkline-bar-${uid}`),
        hasLabels.value ? genBarLabels({ points: barPoints, boundary: barBoundary, offsetX, lineWidth: width }) : undefined,
        h('g', {
          transform: `scale(1,-1) translate(0,-${barBoundary.maxY})`,
          'clip-path': `url(#sparkline-bar-${uid}-clip)`,
          fill: `url(#${uid})`
        }, [
          h('rect', {
            x: 0,
            y: 0,
            width: viewWidth,
            height: viewHeight
          })
        ])
      ])
    }

    function genTrend () {
      const data = setTextColor(props.color, {})

      return h('svg', {
        class: data.class,
        style: data.style,
        'stroke-width': lineWidth.value || 1,
        width: '100%',
        height: '25%',
        viewBox: `0 0 ${props.width} ${props.height}`
      }, [
        genGradient(),
        genLabels(),
        genPathNode()
      ])
    }

    return () => {
      if (totalBars.value < 2) return undefined as any

      return props.type === 'trend'
        ? genTrend()
        : genBar()
    }
  }
})
