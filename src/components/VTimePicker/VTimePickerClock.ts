import "@/css/vuetify.css"

// Composables
import useColorable, { colorProps } from '../../composables/useColorable'
import useThemeable, { themeProps } from '../../composables/useThemeable'

// Types
import { defineComponent, computed, h, PropType, ref, watch } from 'vue'
import type { VNode } from 'vue'

interface Point {
  x: number
  y: number
}

export default defineComponent({
  name: 'v-time-picker-clock',

  props: {
    ...colorProps,
    ...themeProps,
    allowedValues: Function as PropType<((value: number) => boolean) | undefined>,
    disabled: Boolean,
    double: Boolean,
    format: {
      type: Function as PropType<(val: string | number) => string | number>,
      default: (val: string | number) => val,
    },
    max: {
      type: Number,
      required: true,
    },
    min: {
      type: Number,
      required: true,
    },
    scrollable: Boolean,
    readonly: Boolean,
    rotate: {
      type: Number,
      default: 0,
    },
    step: {
      type: Number,
      default: 1,
    },
    value: Number,
  },

  emits: ['change', 'input'],

  setup (props, { emit }) {
    const clock = ref<HTMLElement | null>(null)
    const innerClock = ref<HTMLElement | null>(null)

    const inputValue = ref<number | null>(props.value ?? null)
    const isDragging = ref(false)
    const valueOnMouseDown = ref<number | null>(null)
    const valueOnMouseUp = ref<number | null>(null)

    const { setBackgroundColor } = useColorable(props)
    const { themeClasses } = useThemeable(props)

    const count = computed(() => props.max - props.min + 1)
    const roundCount = computed(() => props.double ? (count.value / 2) : count.value)
    const degreesPerUnit = computed(() => 360 / roundCount.value)
    const degrees = computed(() => degreesPerUnit.value * Math.PI / 180)
    const displayedValue = computed(() => props.value == null ? props.min : props.value)
    const innerRadiusScale = computed(() => 0.62)

    function wheel (e: WheelEvent) {
      e.preventDefault()

      const delta = Math.sign(-e.deltaY || 1)
      let value = displayedValue.value
      do {
        value = value + delta
        value = (value - props.min + count.value) % count.value + props.min
      } while (!isAllowed(value) && value !== displayedValue.value)

      if (value !== displayedValue.value) {
        update(value)
      }
    }

    function isInner (value: number) {
      return props.double && (value - props.min >= roundCount.value)
    }

    function handScale (value: number) {
      return isInner(value) ? innerRadiusScale.value : 1
    }

    function isAllowed (value: number) {
      return !props.allowedValues || props.allowedValues(value)
    }

    function genValues () {
      const children: VNode[] = []

      for (let value = props.min; value <= props.max; value = value + props.step) {
        const color = value === props.value && (props.color || 'accent')
        const data = setBackgroundColor(color, {
          class: {
            'v-time-picker-clock__item': true,
            'v-time-picker-clock__item--active': value === displayedValue.value,
            'v-time-picker-clock__item--disabled': props.disabled || !isAllowed(value),
          },
          style: getTransform(value),
        })

        children.push(h('span', {
          class: data.class,
          style: data.style,
          innerHTML: `<span>${props.format!(value)}</span>`,
        }))
      }

      return children
    }

    function genHand () {
      const scale = `scaleY(${handScale(displayedValue.value)})`
      const angle = props.rotate + degreesPerUnit.value * (displayedValue.value - props.min)
      const color = (props.value != null) && (props.color || 'accent')
      const data = setBackgroundColor(color, {
        class: {
          'v-time-picker-clock__hand': true,
          'v-time-picker-clock__hand--inner': isInner(props.value as number),
        },
        style: {
          transform: `rotate(${angle}deg) ${scale}`,
        },
      })

      return h('div', {
        class: data.class,
        style: data.style,
      })
    }

    function getTransform (i: number) {
      const { x, y } = getPosition(i)
      return {
        left: `${50 + x * 50}%`,
        top: `${50 + y * 50}%`,
      }
    }

    function getPosition (value: number) {
      const rotateRadians = props.rotate * Math.PI / 180
      return {
        x: Math.sin((value - props.min) * degrees.value + rotateRadians) * handScale(value),
        y: -Math.cos((value - props.min) * degrees.value + rotateRadians) * handScale(value),
      }
    }

    function onMouseDown (e: MouseEvent | TouchEvent) {
      e.preventDefault()

      valueOnMouseDown.value = null
      valueOnMouseUp.value = null
      isDragging.value = true
      onDragMove(e)
    }

    function onMouseUp () {
      isDragging.value = false
      if (valueOnMouseUp.value !== null && isAllowed(valueOnMouseUp.value)) {
        emit('change', valueOnMouseUp.value)
      }
    }

    function onDragMove (e: MouseEvent | TouchEvent) {
      e.preventDefault()
      if (!isDragging.value && e.type !== 'click') return

      const clockEl = clock.value
      const innerClockEl = innerClock.value
      if (!clockEl || !innerClockEl) return

      const { width, top, left } = clockEl.getBoundingClientRect()
      const { width: innerWidth } = innerClockEl.getBoundingClientRect()
      const { clientX, clientY } = 'touches' in e ? e.touches[0] : e
      const center = { x: width / 2, y: -width / 2 }
      const coords = { x: clientX - left, y: top - clientY }
      const handAngle = Math.round(angle(center, coords) - props.rotate + 360) % 360
      const insideClick = props.double && euclidean(center, coords) < (innerWidth + innerWidth * innerRadiusScale.value) / 4
      const value = (
        Math.round(handAngle / degreesPerUnit.value) +
        (insideClick ? roundCount.value : 0)
      ) % count.value + props.min

      // Necessary to fix edge case when selecting left part of the value(s) at 12 o'clock
      let newValue: number
      if (handAngle >= (360 - degreesPerUnit.value / 2)) {
        newValue = insideClick ? props.max - roundCount.value + 1 : props.min
      } else {
        newValue = value
      }

      if (isAllowed(value)) {
        if (valueOnMouseDown.value === null) {
          valueOnMouseDown.value = newValue
        }
        valueOnMouseUp.value = newValue
        update(newValue)
      }
    }

    function update (value: number) {
      if (inputValue.value !== value) {
        inputValue.value = value
        emit('input', value)
      }
    }

    function euclidean (p0: Point, p1: Point) {
      const dx = p1.x - p0.x
      const dy = p1.y - p0.y

      return Math.sqrt(dx * dx + dy * dy)
    }

    function angle (center: Point, p1: Point) {
      const value = 2 * Math.atan2(p1.y - center.y - euclidean(center, p1), p1.x - center.x)
      return Math.abs(value * 180 / Math.PI)
    }

    watch(() => props.value, value => {
      inputValue.value = value ?? null
    })

    return () => {
      const listeners = (props.readonly || props.disabled)
        ? {}
        : {
            onMousedown: onMouseDown,
            onMouseup: onMouseUp,
            onMouseleave: () => { if (isDragging.value) onMouseUp() },
            onTouchstart: onMouseDown,
            onTouchend: onMouseUp,
            onMousemove: onDragMove,
            onTouchmove: onDragMove,
          }

      const scrollListeners = props.scrollable && !(props.readonly || props.disabled)
        ? { onWheel: wheel }
        : {}

      return h('div', {
        class: [{
          'v-time-picker-clock': true,
          'v-time-picker-clock--indeterminate': props.value == null,
          ...themeClasses.value,
        }],
        ref: clock,
        ...listeners,
        ...scrollListeners,
      }, [
        h('div', {
          class: 'v-time-picker-clock__inner',
          ref: innerClock,
        }, [
          genHand(),
          genValues(),
        ]),
      ])
    }
  }
})
