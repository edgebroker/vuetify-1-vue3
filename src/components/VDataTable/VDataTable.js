import '@/css/vuetify.css'

// Composables
import useDataIterable, { dataIterableProps } from '../../composables/useDataIterable'
import useThemeable, { themeProps } from '../../composables/useThemeable'
import useDataTableBody from './composables/useDataTableBody'
import useDataTableFoot from './composables/useDataTableFoot'
import useDataTableHead from './composables/useDataTableHead'
import useDataTableProgress from './composables/useDataTableProgress'

// Utils
import { createSimpleFunctional, getObjectValueByPath } from '../../util/helpers'

// Types
import { computed, defineComponent, getCurrentInstance, h } from 'vue'

const VTableOverflow = createSimpleFunctional('v-table__overflow')

function hasTag (elements, tag) {
  if (!Array.isArray(elements)) return false

  return elements.some(node => {
    if (!node || Array.isArray(node)) return false
    return typeof node.type === 'string' && node.type === tag
  })
}

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

  setup (props, { slots, emit }) {
    const iterable = useDataIterable(props, emit)
    const { themeClasses } = useThemeable(props)
    const vm = getCurrentInstance()?.proxy

    const firstSortable = props.headers.find(header => header && (!('sortable' in header) || header.sortable))
    iterable.defaultPagination.value.sortBy = !props.disableInitialSort && firstSortable
      ? firstSortable.value
      : null

    iterable.initPagination()

    const classes = computed(() => ({
      'v-datatable v-table': true,
      'v-datatable--select-all': props.selectAll !== false,
      ...themeClasses.value
    }))

    const filteredItems = computed(() => iterable.filteredItemsImpl(props.headers))

    const headerColumns = computed(() => {
      if (props.headersLength != null) return props.headersLength
      return props.headers.length + (props.selectAll !== false ? 1 : 0)
    })

    function genTR (children, data = {}) {
      const normalizedChildren = Array.isArray(children) ? children : [children]
      const { attrs, ...rest } = data
      const propsOut = { ...rest }
      if (attrs) Object.assign(propsOut, attrs)
      return h('tr', propsOut, normalizedChildren)
    }

    const { genTProgress } = useDataTableProgress({
      genProgress: () => (slots.progress ? slots.progress() : null),
      genTR,
      headerColumns
    })

    const { genTHead } = useDataTableHead(props, { slots }, {
      computedPagination: iterable.computedPagination,
      expanded: iterable.expanded,
      genTR,
      genTProgress,
      hasSelectAll: iterable.hasSelectAll,
      hasTag,
      indeterminate: iterable.indeterminate,
      toggle: iterable.toggle,
      sort: iterable.sort,
      everyItem: iterable.everyItem,
      vm
    })

    const { genTBody } = useDataTableBody(props, { slots }, {
      headerColumns,
      itemKey: props.itemKey,
      isExpanded: iterable.isExpanded,
      isSelected: iterable.isSelected,
      filteredItems,
      createProps: iterable.createProps,
      genTR,
      hasTag
    })

    const { genTFoot, genActionsFooter } = useDataTableFoot(props, { slots }, {
      classes,
      genActions: iterable.genActions,
      genTR
    })

    return () => {
      const tableOverflow = h(VTableOverflow, {}, [
        h('table', { class: classes.value }, [
          genTHead(),
          genTBody(),
          genTFoot()
        ])
      ])

      return h('div', [
        tableOverflow,
        genActionsFooter()
      ])
    }
  }
})

