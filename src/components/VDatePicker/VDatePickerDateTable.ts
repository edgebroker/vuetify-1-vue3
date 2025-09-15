// Utils
import { pad, createNativeLocaleFormatter, monthChange } from './util'
import { createRange } from '../../util/helpers'

// Composables
import useDatePickerTable, { datePickerTableProps } from './composables/useDatePickerTable'

// Types
import { computed, defineComponent, h, PropType } from 'vue'
import type { VNode } from 'vue'
import type { DatePickerFormatter } from './util/createNativeLocaleFormatter'

export default defineComponent({
  name: 'v-date-picker-date-table',

  props: {
    ...datePickerTableProps,
    firstDayOfWeek: {
      type: [String, Number],
      default: 0,
    },
    showWeek: Boolean,
    weekdayFormat: Function as PropType<DatePickerFormatter | undefined>,
  },

  emits: ['input', 'tableDate', 'click:date', 'dblclick:date'],

  setup (props, { emit }) {
    const {
      displayedMonth,
      displayedYear,
      genButton,
      genTable,
    } = useDatePickerTable(props, emit)

    const formatter = computed<DatePickerFormatter>(() =>
      props.format || createNativeLocaleFormatter(props.locale, { day: 'numeric', timeZone: 'UTC' }, { start: 8, length: 2 })
    )

    const weekdayFormatter = computed<DatePickerFormatter | undefined>(() =>
      props.weekdayFormat || createNativeLocaleFormatter(props.locale, { weekday: 'narrow', timeZone: 'UTC' })
    )

    const weekDays = computed(() => {
      const first = parseInt(String(props.firstDayOfWeek), 10)

      return weekdayFormatter.value
        ? createRange(7).map(i => weekdayFormatter.value!(`2017-01-${first + i + 15}`))
        : createRange(7).map(i => ['S', 'M', 'T', 'W', 'T', 'F', 'S'][(i + first) % 7])
    })

    function calculateTableDate (delta: number) {
      return monthChange(props.tableDate, Math.sign(delta || 1))
    }

    function genTHead () {
      const days = weekDays.value.map(day => h('th', day))
      if (props.showWeek) days.unshift(h('th'))
      return h('thead', [h('tr', days)])
    }

    function weekDaysBeforeFirstDayOfTheMonth () {
      const firstDayOfTheMonth = new Date(`${displayedYear.value}-${pad(displayedMonth.value + 1)}-01T00:00:00+00:00`)
      const weekDay = firstDayOfTheMonth.getUTCDay()
      return (weekDay - parseInt(String(props.firstDayOfWeek)) + 7) % 7
    }

    function getWeekNumber () {
      let dayOfYear = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334][displayedMonth.value]
      if (displayedMonth.value > 1 &&
        (((displayedYear.value % 4 === 0) && (displayedYear.value % 100 !== 0)) || (displayedYear.value % 400 === 0))
      ) {
        dayOfYear++
      }
      const offset = (
        displayedYear.value +
        ((displayedYear.value - 1) >> 2) -
        Math.floor((displayedYear.value - 1) / 100) +
        Math.floor((displayedYear.value - 1) / 400) -
        Number(props.firstDayOfWeek)
      ) % 7
      return Math.floor((dayOfYear + offset) / 7) + 1
    }

    function genWeekNumber (weekNumber: number) {
      return h('td', [
        h('small', {
          class: 'v-date-picker-table--date__week',
        }, String(weekNumber).padStart(2, '0')),
      ])
    }

    function genTBody () {
      const children: VNode[] = []
      const daysInMonth = new Date(displayedYear.value, displayedMonth.value + 1, 0).getDate()
      let rows: VNode[] = []
      let day = weekDaysBeforeFirstDayOfTheMonth()
      let weekNumber = getWeekNumber()

      if (props.showWeek) rows.push(genWeekNumber(weekNumber++))

      while (day--) rows.push(h('td'))
      for (day = 1; day <= daysInMonth; day++) {
        const date = `${displayedYear.value}-${pad(displayedMonth.value + 1)}-${pad(day)}`

        rows.push(h('td', [
          genButton(date, true, 'date', formatter.value),
        ]))

        if (rows.length % (props.showWeek ? 8 : 7) === 0) {
          children.push(h('tr', rows))
          rows = []
          if (day < daysInMonth && props.showWeek) rows.push(genWeekNumber(weekNumber++))
        }
      }

      if (rows.length) {
        children.push(h('tr', rows))
      }

      return h('tbody', children)
    }

    return () => genTable(
      'v-date-picker-table v-date-picker-table--date',
      [genTHead(), genTBody()],
      calculateTableDate
    )
  },
})
