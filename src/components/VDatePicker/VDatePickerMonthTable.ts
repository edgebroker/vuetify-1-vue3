// Utils
import { pad, createNativeLocaleFormatter } from './util'

// Composables
import useDatePickerTable, { datePickerTableProps } from './composables/useDatePickerTable'

// Types
import { computed, defineComponent, h } from 'vue'
import type { DatePickerFormatter } from './util/createNativeLocaleFormatter'

export default defineComponent({
  name: 'v-date-picker-month-table',

  props: {
    ...datePickerTableProps,
  },

  emits: ['input', 'tableDate', 'click:month', 'dblclick:month'],

  setup (props, { emit }) {
    const { displayedYear, genButton, genTable } = useDatePickerTable(props, emit)

    const formatter = computed<DatePickerFormatter>(() =>
      props.format || createNativeLocaleFormatter(props.locale, { month: 'short', timeZone: 'UTC' }, { start: 5, length: 2 })
    )

    function calculateTableDate (delta: number) {
      return `${parseInt(props.tableDate, 10) + Math.sign(delta || 1)}`
    }

    function genTBody () {
      const children = []
      const cols = Array(3).fill(null)
      const rows = 12 / cols.length

      for (let row = 0; row < rows; row++) {
        const tds = cols.map((_, col) => {
          const month = row * cols.length + col
          const date = `${displayedYear.value}-${pad(month + 1)}`
          return h('td', { key: month }, [
            genButton(date, false, 'month', formatter.value),
          ])
        })

        children.push(h('tr', { key: row }, tds))
      }

      return h('tbody', children)
    }

    return () => genTable(
      'v-date-picker-table v-date-picker-table--month',
      [genTBody()],
      calculateTableDate
    )
  },
})
