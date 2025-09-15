// Components
import VDatePickerTitle from './VDatePickerTitle'
import VDatePickerHeader from './VDatePickerHeader'
import VDatePickerDateTable from './VDatePickerDateTable'
import VDatePickerMonthTable from './VDatePickerMonthTable'
import VDatePickerYears from './VDatePickerYears'
import VPicker from '../VPicker'

// Composables
import usePicker, { pickerProps } from '../../composables/usePicker'
import useThemeable, { themeProps } from '../../composables/useThemeable'
import { colorProps } from '../../composables/useColorable'

// Utils
import { pad, createNativeLocaleFormatter } from './util'
import isDateAllowed, { AllowedDateFunction } from './util/isDateAllowed'
import { consoleWarn } from '../../util/console'
import { daysInMonth } from '../VCalendar/util/timestamp'

// Types
import { defineComponent, computed, getCurrentInstance, h, PropType, ref, watch } from 'vue'
import type { DatePickerFormatter } from './util/createNativeLocaleFormatter'
import type { VNode } from 'vue'

export type DateEventColorValue = string | string[]
export type DateEvents = string[] | ((date: string) => boolean | DateEventColorValue) | Record<string, DateEventColorValue>
export type DateEventColors = DateEventColorValue | Record<string, DateEventColorValue> | ((date: string) => DateEventColorValue)
type DatePickerValue = string | string[] | undefined
type DatePickerType = 'date' | 'month'
type DatePickerMultipleFormatter = (date: string[]) => string
interface Formatters {
  year: DatePickerFormatter
  titleDate: DatePickerFormatter | DatePickerMultipleFormatter
}

// Adds leading zero to month/day if necessary, returns 'YYYY' if type = 'year',
// 'YYYY-MM' if 'month' and 'YYYY-MM-DD' if 'date'
function sanitizeDateString (dateString: string, type: 'date' | 'month' | 'year'): string {
  const [year, month = 1, date = 1] = dateString.split('-')
  return `${year}-${pad(month)}-${pad(date)}`.substr(0, { date: 10, month: 7, year: 4 }[type])
}

function getLastArrayValue (value: DatePickerValue, multiple: boolean): string | null {
  if (!multiple) {
    return typeof value === 'string' ? value : null
  }

  if (Array.isArray(value) && value.length) {
    return value[value.length - 1]
  }

  return null
}

export default defineComponent({
  name: 'v-date-picker',

  props: {
    ...pickerProps,
    ...themeProps,
    ...colorProps,
    allowedDates: Function as PropType<AllowedDateFunction | undefined>,
    // Function formatting the day in date picker table
    dayFormat: Function as PropType<AllowedDateFunction | undefined>,
    disabled: Boolean,
    events: {
      type: [Array, Function, Object] as PropType<DateEvents>,
      default: () => null,
    },
    eventColor: {
      type: [Array, Function, Object, String] as PropType<DateEventColors>,
      default: () => 'warning',
    },
    firstDayOfWeek: {
      type: [String, Number],
      default: 0,
    },
    // Function formatting the tableDate in the day/month table header
    headerDateFormat: Function as PropType<DatePickerFormatter | undefined>,
    locale: {
      type: String,
      default: 'en-us',
    },
    max: String,
    min: String,
    // Function formatting month in the months table
    monthFormat: Function as PropType<DatePickerFormatter | undefined>,
    multiple: Boolean,
    nextIcon: {
      type: String,
      default: '$vuetify.icons.next',
    },
    pickerDate: String,
    prevIcon: {
      type: String,
      default: '$vuetify.icons.prev',
    },
    reactive: Boolean,
    readonly: Boolean,
    scrollable: Boolean,
    showCurrent: {
      type: [Boolean, String],
      default: true,
    },
    showWeek: Boolean,
    // Function formatting currently selected date in the picker title
    titleDateFormat: Function as PropType<DatePickerFormatter | DatePickerMultipleFormatter | undefined>,
    type: {
      type: String as PropType<DatePickerType>,
      default: 'date',
      validator: (type: any) => ['date', 'month'].includes(type),
    },
    value: [Array, String] as PropType<DatePickerValue>,
    weekdayFormat: Function as PropType<DatePickerFormatter | undefined>,
    // Function formatting the year in table header and pickup title
    yearFormat: Function as PropType<DatePickerFormatter | undefined>,
    yearIcon: String,
  },

  emits: [
    'change',
    'click:date',
    'click:month',
    'dblclick:date',
    'dblclick:month',
    'input',
    'update:pickerDate',
  ],

  setup (props, { emit, slots }) {
    const now = new Date()
    const vm = getCurrentInstance()

    const activePicker = ref(props.type.toUpperCase() as 'DATE' | 'MONTH' | 'YEAR')
    const inputDay = ref<number | null>(null)
    const inputMonth = ref<number | null>(null)
    const inputYear = ref<number | null>(null)
    const isReversing = ref(false)

    const initialLastValue = getLastArrayValue(props.value, props.multiple)
    const initialTableDate = props.pickerDate || sanitizeDateString(
      (initialLastValue || `${now.getFullYear()}-${now.getMonth() + 1}`),
      props.type === 'date' ? 'month' : 'year'
    )
    const tableDate = ref(initialTableDate)

    const { themeClasses } = useThemeable(props)
    const { genPickerActionsSlot } = usePicker(props, { slots })

    const lastValue = computed(() => getLastArrayValue(props.value, props.multiple))

    const selectedMonths = computed(() => {
      if (!props.value || (Array.isArray(props.value) && !props.value.length) || props.type === 'month') {
        return props.value
      } else if (props.multiple && Array.isArray(props.value)) {
        return props.value.map(val => val.substr(0, 7))
      } else if (typeof props.value === 'string') {
        return props.value.substr(0, 7)
      }

      return undefined
    })

    const current = computed(() => {
      if (props.showCurrent === true) {
        return sanitizeDateString(`${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`, props.type)
      }

      return props.showCurrent || null
    })

    const inputDate = computed(() => {
      const year = inputYear.value ?? now.getFullYear()
      const month = (inputMonth.value ?? 0) + 1

      if (props.type === 'date') {
        const day = inputDay.value ?? now.getDate()
        return `${year}-${pad(month)}-${pad(day)}`
      }

      return `${year}-${pad(month)}`
    })

    const tableMonth = computed(() => {
      const [, month] = (props.pickerDate || tableDate.value).split('-')
      return month ? Number(month) - 1 : 0
    })

    const tableYear = computed(() => Number((props.pickerDate || tableDate.value).split('-')[0]))

    const minMonth = computed(() => props.min ? sanitizeDateString(props.min, 'month') : null)
    const maxMonth = computed(() => props.max ? sanitizeDateString(props.max, 'month') : null)
    const minYear = computed(() => props.min ? sanitizeDateString(props.min, 'year') : null)
    const maxYear = computed(() => props.max ? sanitizeDateString(props.max, 'year') : null)

    const defaultTitleDateFormatter = computed<DatePickerFormatter>(() => {
      const titleFormats = {
        year: { year: 'numeric', timeZone: 'UTC' },
        month: { month: 'long', timeZone: 'UTC' },
        date: { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' },
      }

      const titleDateFormatter = createNativeLocaleFormatter(props.locale, titleFormats[props.type], {
        start: 0,
        length: { date: 10, month: 7, year: 4 }[props.type],
      })

      const landscapeFormatter = (date: string) => titleDateFormatter(date)
        .replace(/([^\d\s])([\d])/g, (match, nonDigit, digit) => `${nonDigit} ${digit}`)
        .replace(', ', ',<br>')

      return props.landscape ? landscapeFormatter : titleDateFormatter
    })

    const defaultTitleMultipleDateFormatter = computed<DatePickerMultipleFormatter>(() => {
      if (!Array.isArray(props.value) || props.value.length < 2) {
        return dates => dates.length ? defaultTitleDateFormatter.value(dates[0]) : '0 selected'
      }

      return dates => `${dates.length} selected`
    })

    const formatters = computed<Formatters>(() => ({
      year: props.yearFormat || createNativeLocaleFormatter(props.locale, { year: 'numeric', timeZone: 'UTC' }, { length: 4 }),
      titleDate: props.titleDateFormat || (props.multiple ? defaultTitleMultipleDateFormatter.value : defaultTitleDateFormatter.value),
    }))

    function checkMultipleProp () {
      if (props.value == null) return
      const valueType = (props.value as any).constructor?.name
      const expected = props.multiple ? 'Array' : 'String'
      if (valueType !== expected) {
        consoleWarn(`Value must be ${props.multiple ? 'an' : 'a'} ${expected}, got ${valueType}`, vm?.proxy)
      }
    }

    function isDateAllowedFn (value: string) {
      return isDateAllowed(value, props.min, props.max, props.allowedDates)
    }

    function emitInput (newInput: string) {
      const output = props.multiple
        ? (() => {
            const valueArray = Array.isArray(props.value) ? props.value.slice() : []
            const index = valueArray.indexOf(newInput)
            if (index === -1) {
              valueArray.push(newInput)
            } else {
              valueArray.splice(index, 1)
            }
            return valueArray
          })()
        : newInput

      emit('input', output)
      if (!props.multiple) emit('change', newInput)
    }

    function yearClick (value: number) {
      inputYear.value = value
      if (props.type === 'month') {
        tableDate.value = `${value}`
      } else {
        tableDate.value = `${value}-${pad((tableMonth.value || 0) + 1)}`
      }
      activePicker.value = 'MONTH'
      if (props.reactive && !props.readonly && !props.multiple && isDateAllowedFn(inputDate.value)) {
        emit('input', inputDate.value)
      }
    }

    function monthClick (value: string) {
      const [year, month] = value.split('-').map(Number)
      inputYear.value = year
      inputMonth.value = month - 1
      if (props.type === 'date') {
        if (inputDay.value != null) {
          inputDay.value = Math.min(inputDay.value, daysInMonth(inputYear.value!, (inputMonth.value ?? 0) + 1))
        }

        tableDate.value = value
        activePicker.value = 'DATE'
        if (props.reactive && !props.readonly && !props.multiple && isDateAllowedFn(inputDate.value)) {
          emit('input', inputDate.value)
        }
      } else {
        emitInput(inputDate.value)
      }
    }

    function dateClick (value: string) {
      const [year, month, day] = value.split('-').map(Number)
      inputYear.value = year
      inputMonth.value = month - 1
      inputDay.value = day
      emitInput(inputDate.value)
    }

    function genPickerTitle () {
      return h(VDatePickerTitle, {
        date: props.value ? (formatters.value.titleDate as (value: any) => string)(props.value) : '',
        disabled: props.disabled,
        readonly: props.readonly,
        selectingYear: activePicker.value === 'YEAR',
        year: formatters.value.year(props.value ? `${inputYear.value}` : tableDate.value),
        yearIcon: props.yearIcon,
        value: props.multiple && Array.isArray(props.value) ? props.value[0] : props.value,
        'onUpdate:selectingYear': (value: boolean) => { activePicker.value = value ? 'YEAR' : props.type.toUpperCase() as any },
      })
    }

    function genTableHeader () {
      return h(VDatePickerHeader, {
        nextIcon: props.nextIcon,
        color: props.color,
        dark: props.dark,
        disabled: props.disabled,
        format: props.headerDateFormat,
        light: props.light,
        locale: props.locale,
        min: activePicker.value === 'DATE' ? minMonth.value : minYear.value,
        max: activePicker.value === 'DATE' ? maxMonth.value : maxYear.value,
        prevIcon: props.prevIcon,
        readonly: props.readonly,
        value: activePicker.value === 'DATE' ? `${pad(tableYear.value, 4)}-${pad(tableMonth.value + 1)}` : `${pad(tableYear.value, 4)}`,
        onToggle: () => { activePicker.value = activePicker.value === 'DATE' ? 'MONTH' : 'YEAR' },
        onInput: (value: string) => { tableDate.value = value },
      })
    }

    function genDateTable () {
      return h(VDatePickerDateTable, {
        allowedDates: props.allowedDates,
        color: props.color,
        current: current.value,
        dark: props.dark,
        disabled: props.disabled,
        events: props.events,
        eventColor: props.eventColor,
        firstDayOfWeek: props.firstDayOfWeek,
        format: props.dayFormat,
        light: props.light,
        locale: props.locale,
        min: props.min,
        max: props.max,
        readonly: props.readonly,
        scrollable: props.scrollable,
        showWeek: props.showWeek,
        tableDate: `${pad(tableYear.value, 4)}-${pad(tableMonth.value + 1)}`,
        value: props.value,
        weekdayFormat: props.weekdayFormat,
        onInput: dateClick,
        onTableDate: (value: string) => { tableDate.value = value },
        'onClick:date': (value: string) => emit('click:date', value),
        'onDblclick:date': (value: string) => emit('dblclick:date', value),
      })
    }

    function genMonthTable () {
      return h(VDatePickerMonthTable, {
        allowedDates: props.type === 'month' ? props.allowedDates : null,
        color: props.color,
        current: current.value ? sanitizeDateString(current.value, 'month') : null,
        dark: props.dark,
        disabled: props.disabled,
        events: props.type === 'month' ? props.events : null,
        eventColor: props.type === 'month' ? props.eventColor : null,
        format: props.monthFormat,
        light: props.light,
        locale: props.locale,
        min: minMonth.value,
        max: maxMonth.value,
        readonly: props.readonly && props.type === 'month',
        scrollable: props.scrollable,
        value: selectedMonths.value,
        tableDate: `${pad(tableYear.value, 4)}`,
        onInput: monthClick,
        onTableDate: (value: string) => { tableDate.value = value },
        'onClick:month': (value: string) => emit('click:month', value),
        'onDblclick:month': (value: string) => emit('dblclick:month', value),
      })
    }

    function genYears () {
      return h(VDatePickerYears, {
        color: props.color,
        format: props.yearFormat,
        locale: props.locale,
        min: minYear.value,
        max: maxYear.value,
        value: tableYear.value,
        onInput: yearClick,
      })
    }

    function genPickerBody () {
      const children = activePicker.value === 'YEAR'
        ? [genYears()]
        : [
            genTableHeader(),
            activePicker.value === 'DATE' ? genDateTable() : genMonthTable(),
          ]

      return h('div', { key: activePicker.value }, children)
    }

    function setInputDate () {
      if (lastValue.value) {
        const array = lastValue.value.split('-')
        inputYear.value = parseInt(array[0], 10)
        inputMonth.value = parseInt(array[1], 10) - 1
        if (props.type === 'date') {
          inputDay.value = parseInt(array[2], 10)
        }
      } else {
        if (inputYear.value == null) inputYear.value = now.getFullYear()
        if (inputMonth.value == null) inputMonth.value = now.getMonth()
        if (inputDay.value == null) inputDay.value = now.getDate()
      }
    }

    watch(tableDate, (val, prev) => {
      if (prev != null) {
        const sanitizeType = props.type === 'month' ? 'year' : 'month'
        isReversing.value = sanitizeDateString(val, sanitizeType) < sanitizeDateString(prev, sanitizeType)
      }
      emit('update:pickerDate', val)
    })

    watch(() => props.pickerDate, val => {
      if (val) {
        tableDate.value = val
      } else if (lastValue.value && props.type === 'date') {
        tableDate.value = sanitizeDateString(lastValue.value, 'month')
      } else if (lastValue.value && props.type === 'month') {
        tableDate.value = sanitizeDateString(lastValue.value, 'year')
      }
    })

    watch(() => props.value, (newValue, oldValue) => {
      checkMultipleProp()
      setInputDate()

      if (!props.pickerDate) {
        if (!props.multiple && typeof newValue === 'string') {
          tableDate.value = sanitizeDateString(inputDate.value, props.type === 'month' ? 'year' : 'month')
        } else if (props.multiple) {
          const newArray = Array.isArray(newValue) ? newValue : []
          const oldArray = Array.isArray(oldValue) ? oldValue : []
          if (newArray.length && !oldArray.length) {
            tableDate.value = sanitizeDateString(inputDate.value, props.type === 'month' ? 'year' : 'month')
          }
        }
      }
    })

    watch(() => props.type, type => {
      activePicker.value = type.toUpperCase() as 'DATE' | 'MONTH' | 'YEAR'

      if (props.value) {
        const values = props.multiple
          ? (Array.isArray(props.value) ? props.value : [])
          : typeof props.value === 'string'
            ? [props.value]
            : []

        const output = values
          .map(val => sanitizeDateString(val, type === 'month' ? 'month' : type))
          .filter(isDateAllowedFn)

        if (props.multiple) {
          emit('input', output)
        } else if (output[0]) {
          emit('input', output[0])
        }
      }
    })

    checkMultipleProp()
    if (props.pickerDate !== tableDate.value) {
      emit('update:pickerDate', tableDate.value)
    }
    setInputDate()

    return () => {
      const pickerSlots: Record<string, () => VNode | VNode[] | undefined> = {}

      if (!props.noTitle) {
        const title = genPickerTitle()
        if (title) pickerSlots.title = () => title
      }

      const body = genPickerBody()
      if (body) pickerSlots.default = () => body

      const actions = genPickerActionsSlot()
      if (actions) pickerSlots.actions = () => actions

      return h(VPicker, {
        class: ['v-picker--date', themeClasses.value],
        color: props.headerColor || props.color,
        dark: props.dark,
        fullWidth: props.fullWidth,
        landscape: props.landscape,
        light: props.light,
        width: props.width,
      }, pickerSlots)
    }
  },
})
