import '@/css/vuetify.css'

// Composables
import useDataIterable, { dataIterableProps } from '../../composables/useDataIterable'
import useThemeable, { themeProps } from '../../composables/useThemeable'

// Utils
import { createSimpleFunctional, getObjectValueByPath } from '../../util/helpers'

// Types
import { defineComponent, h } from 'vue'

const VTableOverflow = createSimpleFunctional('v-table__overflow')

export default defineComponent({
  name: 'v-data-table',

  props: {
    headers: {
      type: Array,
      default: () => []
    },
    headersLength: {
      type: Number
    },
    headerText: {
      type: String,
      default: 'text'
    },
    headerKey: {
      type: String,
      default: null
    },
    hideHeaders: Boolean,
    rowsPerPageText: {
      type: String,
      default: '$vuetify.dataTable.rowsPerPageText'
    },
    customFilter: {
      type: Function,
      default: (items, search, filter, headers) => {
        search = search.toString().toLowerCase()
        if (search.trim() === '') return items
        const props = headers.map(h => h.value)
        return items.filter(item => props.some(prop => filter(getObjectValueByPath(item, prop, item[prop]), search)))
      }
    },
    ...dataIterableProps,
    ...themeProps
  },

  setup (props, { slots, attrs, emit }) {
    const iterable = useDataIterable(props, emit)
    const { themeClasses } = useThemeable(props)

    iterable.initPagination()

    function classes () {
      return {
        'v-datatable v-table': true,
        'v-datatable--select-all': props.selectAll !== false,
        ...themeClasses.value
      }
    }

    const filteredItems = () => iterable.filteredItemsImpl(props.headers)

    return () => {
      const headerRow = !props.hideHeaders ? h('thead', [h('tr', props.headers.map((hObj, i) => h('th', { key: props.headerKey ? hObj[props.headerKey] : i }, hObj[props.headerText])) )]) : null
      const bodyRows = h('tbody', filteredItems().map((item, index) => {
        return slots.item ? slots.item(iterable.createProps(item, index)) : null
      }))

      const table = h(VTableOverflow, {}, [
        h('table', { class: classes() }, [headerRow, bodyRows])
      ])

      return h('div', [table, iterable.genActions ? iterable.genActions() : null])
    }
  }
})

