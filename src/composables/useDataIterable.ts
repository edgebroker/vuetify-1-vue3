import { ref, reactive, computed, watch, nextTick, getCurrentInstance } from 'vue'
import { getObjectValueByPath, isObject } from '../utl/helpers'
import { consoleWarn } from '../utl/console'

export const dataIterableProps = {
  expand: Boolean,
  hideActions: Boolean,
  disableInitialSort: Boolean,
  mustSort: Boolean,
  noResultsText: {
    type: String,
    default: '$vuetify.dataIterator.noResultsText'
  },
  nextIcon: {
    type: String,
    default: '$vuetify.icons.next'
  },
  prevIcon: {
    type: String,
    default: '$vuetify.icons.prev'
  },
  rowsPerPageItems: {
    type: Array,
    default () {
      return [
        5,
        10,
        25,
        {
          text: '$vuetify.dataIterator.rowsPerPageAll',
          value: -1
        }
      ]
    }
  },
  rowsPerPageText: {
    type: String,
    default: '$vuetify.dataIterator.rowsPerPageText'
  },
  selectAll: [Boolean, String],
  search: {
    required: false
  },
  filter: {
    type: Function,
    default: (val, search) => {
      return val != null &&
        typeof val !== 'boolean' &&
        val.toString().toLowerCase().indexOf(search) !== -1
    }
  },
  customFilter: {
    type: Function,
    default: (items, search, filter) => {
      search = search.toString().toLowerCase()
      if (search.trim() === '') return items

      return items.filter(i => (
        Object.keys(i).some(j => filter(i[j], search))
      ))
    }
  },
  customSort: {
    type: Function,
    default: (items, index, isDescending) => {
      if (index === null) return items

      return items.sort((a, b) => {
        let sortA = getObjectValueByPath(a, index)
        let sortB = getObjectValueByPath(b, index)

        if (isDescending) {
          ;[sortA, sortB] = [sortB, sortA]
        }

        if (!isNaN(sortA) && !isNaN(sortB)) {
          return sortA - sortB
        }

        if (sortA === null && sortB === null) {
          return 0
        }

        ;[sortA, sortB] = [sortA, sortB]
          .map(s => ((s || '').toString().toLocaleLowerCase()))

        if (sortA > sortB) return 1
        if (sortA < sortB) return -1

        return 0
      })
    }
  },
  value: {
    type: Array,
    default: () => []
  },
  items: {
    type: Array,
    required: true,
    default: () => []
  },
  totalItems: {
    type: Number,
    default: null
  },
  itemKey: {
    type: String,
    default: 'id'
  },
  pagination: {
    type: Object,
    default: () => ({})
  }
}

export default function useDataIterable (props, emit) {
  const searchLength = ref(0)
  const defaultPagination = ref({
    descending: false,
    page: 1,
    rowsPerPage: 5,
    sortBy: null,
    totalItems: 0
  })
  const expanded = reactive({})

  const actionsClasses = 'v-data-iterator__actions'
  const actionsRangeControlsClasses = 'v-data-iterator__actions__range-controls'
  const actionsSelectClasses = 'v-data-iterator__actions__select'
  const actionsPaginationClasses = 'v-data-iterator__actions__pagination'

  const hasPagination = computed(() => {
    const pagination = props.pagination || {}
    return Object.keys(pagination).length > 0
  })

  const computedPagination = computed(() => {
    return hasPagination.value ? props.pagination : defaultPagination.value
  })

  const vm = getCurrentInstance()?.proxy

  const computedRowsPerPageItems = computed(() => {
    return props.rowsPerPageItems.map(item => {
      return isObject(item)
        ? Object.assign({}, item, { text: vm.$vuetify.t(item.text) })
        : { value: item, text: Number(item).toLocaleString(vm.$vuetify.lang.current) }
    })
  })

  const hasSelectAll = computed(() => props.selectAll !== undefined && props.selectAll !== false)

  const selected = computed(() => {
    const selected = {}
    for (let index = 0; index < props.value.length; index++) {
      const key = getObjectValueByPath(props.value[index], props.itemKey)
      selected[key] = true
    }
    return selected
  })

  const hasSearch = computed(() => props.search != null)

  const itemsLength = computed(() => {
    return hasSearch.value ? searchLength.value : (props.totalItems || props.items.length)
  })

  const getPage = computed(() => {
    const { rowsPerPage } = computedPagination.value
    return rowsPerPage === Object(rowsPerPage) ? rowsPerPage.value : rowsPerPage
  })

  const pageStart = computed(() => {
    return getPage.value === -1 ? 0 : (computedPagination.value.page - 1) * getPage.value
  })

  const pageStop = computed(() => {
    return getPage.value === -1 ? itemsLength.value : computedPagination.value.page * getPage.value
  })

  function isSelected (item) {
    return !!selected.value[getObjectValueByPath(item, props.itemKey)]
  }

  function isExpanded (item) {
    return !!expanded[getObjectValueByPath(item, props.itemKey)]
  }

  const everyItem = computed(() => {
    return filteredItems.value.length && filteredItems.value.every(i => isSelected(i))
  })

  const someItems = computed(() => {
    return filteredItems.value.some(i => isSelected(i))
  })

  const indeterminate = computed(() => hasSelectAll.value && someItems.value && !everyItem.value)

  function filteredItemsImpl (...additionalFilterArgs) {
    if (props.totalItems) return props.items

    let items = props.items.slice()

    if (hasSearch.value) {
      items = props.customFilter(items, props.search, props.filter, ...additionalFilterArgs)
      searchLength.value = items.length
    }

    items = props.customSort(
      items,
      computedPagination.value.sortBy,
      computedPagination.value.descending
    )

    return props.hideActions && !hasPagination.value
      ? items
      : items.slice(pageStart.value, pageStop.value)
  }

  const filteredItems = computed(() => filteredItemsImpl())

  function updatePagination (val) {
    const pagination = hasPagination.value ? props.pagination : defaultPagination.value
    const updated = Object.assign({}, pagination, val)
    emit('update:pagination', updated)
    if (!hasPagination.value) {
      defaultPagination.value = updated
    }
  }

  function resetPagination () {
    if (computedPagination.value.page !== 1) {
      updatePagination({ page: 1 })
    }
  }

  function sort (index) {
    const { sortBy, descending } = computedPagination.value
    if (sortBy === null) {
      updatePagination({ sortBy: index, descending: false })
    } else if (sortBy === index && !descending) {
      updatePagination({ descending: true })
    } else if (sortBy !== index) {
      updatePagination({ sortBy: index, descending: false })
    } else if (!props.mustSort) {
      updatePagination({ sortBy: null, descending: null })
    } else {
      updatePagination({ sortBy: index, descending: false })
    }
  }

  function toggle (value) {
    const newSelected = Object.assign({}, selected.value)
    for (let index = 0; index < filteredItems.value.length; index++) {
      const key = getObjectValueByPath(filteredItems.value[index], props.itemKey)
      newSelected[key] = value
    }
    const result = props.items.filter(i => {
      const key = getObjectValueByPath(i, props.itemKey)
      return newSelected[key]
    })
    emit('input', result)
  }

  function createProps (item, index) {
    const propsOut = { item, index }
    const keyProp = props.itemKey
    const itemKey = getObjectValueByPath(item, keyProp)

    Object.defineProperty(propsOut, 'selected', {
      get: () => selected.value[itemKey],
      set: val => {
        if (itemKey == null) {
          consoleWarn(`"${keyProp}" attribute must be defined for item`)
        }
        let sel = props.value.slice()
        if (val) sel.push(item)
        else sel = sel.filter(i => getObjectValueByPath(i, keyProp) !== itemKey)
        emit('input', sel)
      }
    })

    Object.defineProperty(propsOut, 'expanded', {
      get: () => expanded[itemKey],
      set: val => {
        if (itemKey == null) {
          consoleWarn(`"${keyProp}" attribute must be defined for item`)
        }
        if (!props.expand) {
          for (const key in expanded) {
            if (Object.prototype.hasOwnProperty.call(expanded, key)) {
              expanded[key] = false
            }
          }
        }
        expanded[itemKey] = val
      }
    })

    return propsOut
  }

  function initPagination () {
    if (!props.rowsPerPageItems.length) {
      consoleWarn(`The prop 'rows-per-page-items' can not be empty`)
    } else {
      defaultPagination.value.rowsPerPage = props.rowsPerPageItems[0]
    }

    defaultPagination.value.totalItems = props.items.length

    updatePagination(Object.assign({}, defaultPagination.value, props.pagination))
  }

  watch(() => props.items, () => {
    if (pageStart.value >= itemsLength.value) {
      resetPagination()
    }

    if (props.totalItems === null) {
      const newItemKeys = new Set(props.items.map(item => getObjectValueByPath(item, props.itemKey)))
      const selection = props.value.filter(item => newItemKeys.has(getObjectValueByPath(item, props.itemKey)))
      if (selection.length !== props.value.length) {
        emit('input', selection)
      }
    }
  })

  watch(() => props.search, () => {
    nextTick(() => {
      updatePagination({ page: 1, totalItems: itemsLength.value })
    })
  })

  watch(() => computedPagination.value.sortBy, resetPagination)
  watch(() => computedPagination.value.descending, resetPagination)

  return {
    searchLength,
    defaultPagination,
    expanded,
    actionsClasses,
    actionsRangeControlsClasses,
    actionsSelectClasses,
    actionsPaginationClasses,
    computedPagination,
    computedRowsPerPageItems,
    hasPagination,
    hasSelectAll,
    itemsLength,
    indeterminate,
    everyItem,
    someItems,
    getPage,
    pageStart,
    pageStop,
    filteredItems,
    selected,
    hasSearch,
    updatePagination,
    isSelected,
    isExpanded,
    filteredItemsImpl,
    resetPagination,
    sort,
    toggle,
    createProps,
    initPagination
  }
}

