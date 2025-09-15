import { computed, getCurrentInstance, h, ref, watch, withDirectives, Transition } from 'vue'

// Directives
import Touch, { TouchWrapper } from '../directives/touch'

// Composables
import useColorable, { colorProps, setBackgroundColor } from './useColorable'
import useThemeable, { themeProps } from './useThemeable'

// Utils
import isDateAllowed, { AllowedDateFunction } from '../components/VDatePicker/util/isDateAllowed'

// Types
import type { PropType, VNode, VNodeArrayChildren } from 'vue'
import type { DatePickerFormatter } from '../components/VDatePicker/util/createNativeLocaleFormatter'
import type { DateEventColors, DateEventColorValue, DateEvents } from '../components/VDatePicker/VDatePicker'

type CalculateTableDateFunction = (value: number) => string

type EmitFn = (event: string, ...args: any[]) => void

export const datePickerTableProps = {
  ...colorProps,
  ...themeProps,
  allowedDates: Function as PropType<AllowedDateFunction | undefined>,
  current: String,
  disabled: Boolean,
  format: Function as PropType<DatePickerFormatter | undefined>,
  events: {
    type: [Array, Function, Object] as PropType<DateEvents>,
    default: () => null,
  },
  eventColor: {
    type: [Array, Function, Object, String] as PropType<DateEventColors>,
    default: () => 'warning',
  },
  locale: {
    type: String,
    default: 'en-us',
  },
  min: String,
  max: String,
  readonly: Boolean,
  scrollable: Boolean,
  tableDate: {
    type: String,
    required: true,
  },
  value: [String, Array] as PropType<string | string[] | null>,
}

export default function useDatePickerTable (props: any, emit: EmitFn) {
  const { themeClasses } = useThemeable(props)
  const { setBackgroundColor: setBgColor, setTextColor: setTxtColor } = useColorable(props)

  const vm = getCurrentInstance()
  const isRtl = computed(() => Boolean(vm?.proxy?.$vuetify?.rtl))

  const isReversing = ref(false)

  watch(() => props.tableDate, (newVal: string, oldVal: string | undefined) => {
    if (oldVal == null) return
    isReversing.value = newVal < oldVal
  })

  const computedTransition = computed(() =>
    (isReversing.value === !isRtl.value) ? 'tab-reverse-transition' : 'tab-transition'
  )

  const displayedMonth = computed(() => {
    const parts = String(props.tableDate).split('-')
    const month = parts[1]
    return month != null ? Number(month) - 1 : 0
  })

  const displayedYear = computed(() => Number(String(props.tableDate).split('-')[0]))

  function genButtonClasses (isAllowed: boolean, isFloating: boolean, isSelected: boolean, isCurrent: boolean) {
    return {
      'v-btn--active': isSelected,
      'v-btn--flat': !isSelected,
      'v-btn--icon': isSelected && isAllowed && isFloating,
      'v-btn--floating': isFloating,
      'v-btn--depressed': !isFloating && isSelected,
      'v-btn--disabled': !isAllowed || (props.disabled && isSelected),
      'v-btn--outline': isCurrent && !isSelected,
      ...themeClasses.value,
    }
  }

  function getEventColors (date: string) {
    const arrayize = (v: string | string[]) => Array.isArray(v) ? v : [v]
    let eventData: boolean | DateEventColorValue
    let eventColors: string[] = []

    if (Array.isArray(props.events)) {
      eventData = props.events.includes(date)
    } else if (typeof props.events === 'function') {
      eventData = props.events(date) || false
    } else if (props.events) {
      eventData = props.events[date] || false
    } else {
      eventData = false
    }

    if (!eventData) {
      return []
    } else if (eventData !== true) {
      eventColors = arrayize(eventData)
    } else if (typeof props.eventColor === 'string') {
      eventColors = [props.eventColor]
    } else if (typeof props.eventColor === 'function') {
      eventColors = arrayize(props.eventColor(date))
    } else if (Array.isArray(props.eventColor)) {
      eventColors = props.eventColor
    } else {
      eventColors = arrayize(props.eventColor[date])
    }

    return eventColors.filter(Boolean)
  }

  function genEvents (date: string) {
    const eventColors = getEventColors(date)

    if (!eventColors.length) return null

    return h('div', { class: 'v-date-picker-table__events' },
      eventColors.map(color => h('div', setBackgroundColor(color))))
  }

  function genButton (value: string, isFloating: boolean, mouseEventType: string, formatter: DatePickerFormatter): VNode {
    const isAllowed = isDateAllowed(value, props.min, props.max, props.allowedDates)
    const isSelected = value === props.value || (Array.isArray(props.value) && props.value.indexOf(value) !== -1)
    const isCurrent = value === props.current
    const setColor = isSelected ? setBgColor : setTxtColor
    const color = (isSelected || isCurrent) && (props.color || 'accent')

    const onClick = () => {
      if (props.disabled) return
      if (isAllowed && !props.readonly) emit('input', value)
      emit(`click:${mouseEventType}`, value)
    }

    const onDblclick = () => {
      if (props.disabled) return
      emit(`dblclick:${mouseEventType}`, value)
    }

    const data = setColor(color, {
      class: ['v-btn', genButtonClasses(isAllowed, isFloating, isSelected, isCurrent)],
      style: {},
    })

    return h('button', {
      ...data,
      type: 'button',
      disabled: props.disabled || !isAllowed,
      onClick,
      onDblclick,
    }, [
      h('div', { class: 'v-btn__content' }, formatter(value)),
      genEvents(value),
    ])
  }

  function wheel (e: WheelEvent, calculateTableDate: CalculateTableDateFunction) {
    e.preventDefault()
    emit('tableDate', calculateTableDate(e.deltaY))
  }

  function touch (value: number, calculateTableDate: CalculateTableDateFunction) {
    emit('tableDate', calculateTableDate(value))
  }

  function genTable (staticClass: string, children: VNodeArrayChildren, calculateTableDate: CalculateTableDateFunction) {
    const transition = h(Transition, { name: computedTransition.value }, {
      default: () => [h('table', { key: props.tableDate }, children)],
    })

    const node = h('div', {
      class: [
        staticClass,
        {
          'v-date-picker-table--disabled': props.disabled,
        },
        themeClasses.value,
      ],
      onWheel: (!props.disabled && props.scrollable) ? (e: WheelEvent) => wheel(e, calculateTableDate) : undefined,
    }, [transition])

    return withDirectives(node, [[Touch as any, {
      left: (e: TouchWrapper) => (e.offsetX < -15) && touch(1, calculateTableDate),
      right: (e: TouchWrapper) => (e.offsetX > 15) && touch(-1, calculateTableDate),
    }]])
  }

  return {
    displayedMonth,
    displayedYear,
    genButton,
    genTable,
  }
}
