// Components
import VTimePickerTitle from './VTimePickerTitle'
import VTimePickerClock from './VTimePickerClock'
import VPicker from '../VPicker'

// Composables
import usePicker, { pickerProps } from '../../composables/usePicker'
import useThemeable, { themeProps } from '../../composables/useThemeable'
import { colorProps } from '../../composables/useColorable'

// Utils
import { createRange } from '../../util/helpers'
import pad from '../VDatePicker/util/pad'

// Types
import { defineComponent, computed, h, PropType, ref, watch } from 'vue'
import type { VNode } from 'vue'

const rangeHours24 = createRange(24)
const rangeHours12am = createRange(12)
const rangeHours12pm = rangeHours12am.map(v => v + 12)
const range60 = createRange(60)
const selectingTimes: {
  hour: 1
  minute: 2
  second: 3
} = { hour: 1, minute: 2, second: 3 }
const selectingNames = { 1: 'hour', 2: 'minute', 3: 'second' }
export { selectingTimes }

type Period = 'am' | 'pm'

export default defineComponent({
  name: 'v-time-picker',

  props: {
    ...pickerProps,
    ...themeProps,
    ...colorProps,
    allowedHours: Function as PropType<((value: number) => boolean) | undefined>,
    allowedMinutes: Function as PropType<((value: number) => boolean) | undefined>,
    allowedSeconds: Function as PropType<((value: number) => boolean) | undefined>,
    disabled: Boolean,
    format: {
      type: String as PropType<'ampm' | '24hr'>,
      default: 'ampm',
      validator: (val: string) => ['ampm', '24hr'].includes(val),
    },
    min: String,
    max: String,
    readonly: Boolean,
    scrollable: Boolean,
    useSeconds: Boolean,
    value: null as unknown as PropType<any>,
  },

  emits: [
    'change',
    'click:hour',
    'click:minute',
    'click:second',
    'input',
  ],

  setup (props, { emit, slots }) {
    const inputHour = ref<number | null>(null)
    const inputMinute = ref<number | null>(null)
    const inputSecond = ref<number | null>(null)
    const lazyInputHour = ref<number | null>(null)
    const lazyInputMinute = ref<number | null>(null)
    const lazyInputSecond = ref<number | null>(null)
    const period = ref<Period>('am')
    const selecting = ref<1 | 2 | 3>(selectingTimes.hour)

    const clockRef = ref<InstanceType<typeof VTimePickerClock> | null>(null)

    const { themeClasses } = useThemeable(props)
    const { genPickerActionsSlot } = usePicker(props, { slots })

    const isAmPm = computed(() => props.format === 'ampm')

    const isAllowedHourCb = computed(() => {
      if (!props.min && !props.max) return props.allowedHours

      const minHour = props.min ? Number(props.min.split(':')[0]) : 0
      const maxHour = props.max ? Number(props.max.split(':')[0]) : 23

      return (val: number) => {
        return val >= minHour &&
          val <= maxHour &&
          (!props.allowedHours || props.allowedHours(val))
      }
    })

    const isAllowedMinuteCb = computed(() => {
      const isHourAllowed = !props.allowedHours || (inputHour.value != null && props.allowedHours(inputHour.value))
      if (!props.min && !props.max) {
        return isHourAllowed ? props.allowedMinutes : (() => false)
      }

      const [minHour, minMinute] = props.min ? props.min.split(':').map(Number) : [0, 0]
      const [maxHour, maxMinute] = props.max ? props.max.split(':').map(Number) : [23, 59]
      const minTime = minHour * 60 + minMinute
      const maxTime = maxHour * 60 + maxMinute

      return (val: number) => {
        if (inputHour.value == null) return false

        const time = 60 * inputHour.value + val
        return time >= minTime &&
          time <= maxTime &&
          isHourAllowed &&
          (!props.allowedMinutes || props.allowedMinutes(val))
      }
    })

    const isAllowedSecondCb = computed(() => {
      const isHourAllowed = !props.allowedHours || (inputHour.value != null && props.allowedHours(inputHour.value))
      const isMinuteAllowed = !props.allowedMinutes || (inputMinute.value != null && props.allowedMinutes(inputMinute.value))
      if (!props.min && !props.max) {
        return (isHourAllowed && isMinuteAllowed) ? props.allowedSeconds : (() => false)
      }

      const [minHour, minMinute, minSecond] = props.min ? props.min.split(':').map(Number) : [0, 0, 0]
      const [maxHour, maxMinute, maxSecond] = props.max ? props.max.split(':').map(Number) : [23, 59, 59]
      const minTime = minHour * 3600 + minMinute * 60 + (minSecond || 0)
      const maxTime = maxHour * 3600 + maxMinute * 60 + (maxSecond || 0)

      return (val: number) => {
        if (inputHour.value == null || inputMinute.value == null) return false

        const time = 3600 * inputHour.value + 60 * inputMinute.value + val
        return time >= minTime &&
          time <= maxTime &&
          isHourAllowed && isMinuteAllowed &&
          (!props.allowedSeconds || props.allowedSeconds(val))
      }
    })

    function convert24to12 (hour: number) {
      return hour ? ((hour - 1) % 12 + 1) : 12
    }

    function convert12to24 (hour: number, newPeriod: Period) {
      return hour % 12 + (newPeriod === 'pm' ? 12 : 0)
    }

    function genValue () {
      if (inputHour.value != null && inputMinute.value != null && (!props.useSeconds || inputSecond.value != null)) {
        return `${pad(inputHour.value)}:${pad(inputMinute.value)}` + (props.useSeconds ? `:${pad(inputSecond.value!)}` : '')
      }

      return null
    }

    function emitValue () {
      const value = genValue()
      if (value !== null) emit('input', value)
    }

    function setPeriod (newPeriod: Period) {
      period.value = newPeriod
      if (inputHour.value != null) {
        const newHour = inputHour.value + (newPeriod === 'am' ? -12 : 12)
        inputHour.value = firstAllowed('hour', newHour)
        emitValue()
      }
    }

    function setInputData (value: string | null | Date) {
      if (value == null || value === '') {
        inputHour.value = null
        inputMinute.value = null
        inputSecond.value = null
      } else if (value instanceof Date) {
        inputHour.value = value.getHours()
        inputMinute.value = value.getMinutes()
        inputSecond.value = value.getSeconds()
      } else {
        const match = (value.trim().toLowerCase().match(/^(\d+):(\d+)(:(\d+))?([ap]m)?$/) || new Array(6)) as string[]
        const [, hour, minute, , second, periodMatch] = match

        const parsedHour = parseInt(hour, 10)
        inputHour.value = periodMatch ? convert12to24(parsedHour, periodMatch as Period) : parsedHour
        inputMinute.value = parseInt(minute, 10)
        inputSecond.value = parseInt((second || '0'), 10)
      }

      period.value = (inputHour.value == null || inputHour.value < 12) ? 'am' : 'pm'
    }

    function onInput (value: number) {
      if (selecting.value === selectingTimes.hour) {
        inputHour.value = isAmPm.value ? convert12to24(value, period.value) : value
      } else if (selecting.value === selectingTimes.minute) {
        inputMinute.value = value
      } else {
        inputSecond.value = value
      }
      emitValue()
    }

    function onChange (value: number) {
      emit(`click:${selectingNames[selecting.value]}`, value)

      const emitChange = selecting.value === (props.useSeconds ? selectingTimes.second : selectingTimes.minute)

      if (selecting.value === selectingTimes.hour) {
        selecting.value = selectingTimes.minute
      } else if (props.useSeconds && selecting.value === selectingTimes.minute) {
        selecting.value = selectingTimes.second
      }

      if (inputHour.value === lazyInputHour.value &&
        inputMinute.value === lazyInputMinute.value &&
        (!props.useSeconds || inputSecond.value === lazyInputSecond.value)
      ) return

      const time = genValue()
      if (time === null) return

      lazyInputHour.value = inputHour.value
      lazyInputMinute.value = inputMinute.value
      if (props.useSeconds) lazyInputSecond.value = inputSecond.value

      if (emitChange) emit('change', time)
    }

    function firstAllowed (type: 'hour' | 'minute' | 'second', value: number) {
      const allowedFn = type === 'hour'
        ? isAllowedHourCb.value
        : type === 'minute'
          ? isAllowedMinuteCb.value
          : isAllowedSecondCb.value

      if (!allowedFn) return value

      const range = type === 'minute'
        ? range60
        : type === 'second'
          ? range60
          : (isAmPm.value
            ? (value < 12 ? rangeHours12am : rangeHours12pm)
            : rangeHours24)
      const first = range.find(v => allowedFn((v + value) % range.length + range[0]))
      return ((first || 0) + value) % range.length + range[0]
    }

    function genClock (): VNode {
      return h(VTimePickerClock, {
        allowedValues:
          selecting.value === selectingTimes.hour
            ? isAllowedHourCb.value
            : (selecting.value === selectingTimes.minute
              ? isAllowedMinuteCb.value
              : isAllowedSecondCb.value),
        color: props.color,
        dark: props.dark,
        disabled: props.disabled,
        double: selecting.value === selectingTimes.hour && !isAmPm.value,
        format: selecting.value === selectingTimes.hour
          ? (isAmPm.value ? convert24to12 : (val: number) => val)
          : (val: number) => pad(val, 2),
        light: props.light,
        max: selecting.value === selectingTimes.hour ? (isAmPm.value && period.value === 'am' ? 11 : 23) : 59,
        min: selecting.value === selectingTimes.hour && isAmPm.value && period.value === 'pm' ? 12 : 0,
        readonly: props.readonly,
        scrollable: props.scrollable,
        size: Number(props.width) - ((!props.fullWidth && props.landscape) ? 80 : 20),
        step: selecting.value === selectingTimes.hour ? 1 : 5,
        value: selecting.value === selectingTimes.hour
          ? inputHour.value
          : (selecting.value === selectingTimes.minute
            ? inputMinute.value
            : inputSecond.value),
        ref: clockRef,
        onInput: onInput,
        onChange: onChange,
      })
    }

    function genPickerBody () {
      return h('div', {
        class: 'v-time-picker-clock__container',
        key: selecting.value,
      }, [genClock()])
    }

    function genPickerTitle () {
      return h(VTimePickerTitle, {
        ampm: isAmPm.value,
        disabled: props.disabled,
        hour: inputHour.value,
        minute: inputMinute.value,
        second: inputSecond.value,
        period: period.value,
        readonly: props.readonly,
        useSeconds: props.useSeconds,
        selecting: selecting.value,
        ['onUpdate:selecting']: (value: 1 | 2 | 3) => (selecting.value = value),
        ['onUpdate:period']: setPeriod,
      })
    }

    watch(() => props.value, value => {
      setInputData(value as any)
    }, { immediate: true })

    return () => {
      const pickerSlots: Record<string, () => VNode | VNode[] | null | undefined> = {}

      if (!props.noTitle) {
        const title = genPickerTitle()
        if (title) pickerSlots.title = () => title
      }

      const body = genPickerBody()
      if (body) pickerSlots.default = () => body

      const actions = genPickerActionsSlot()
      if (actions) pickerSlots.actions = () => actions

      return h(VPicker, {
        class: ['v-picker--time', themeClasses.value],
        color: props.headerColor || props.color,
        dark: props.dark,
        fullWidth: props.fullWidth,
        landscape: props.landscape,
        light: props.light,
        width: props.width,
      }, pickerSlots)
    }
  }
})
