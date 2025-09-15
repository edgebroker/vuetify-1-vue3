import { defineComponent } from 'vue'

// Composables
import useDatePickerTable, { datePickerTableProps } from '../../../composables/useDatePickerTable'

export default defineComponent({
  name: 'date-picker-table',

  props: {
    ...datePickerTableProps,
  },

  setup (props, { emit }) {
    const table = useDatePickerTable(props, emit)

    return {
      ...table,
    }
  },
})
