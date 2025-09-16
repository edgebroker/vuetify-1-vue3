import { consoleWarn } from '../../../util/console'

import VCheckbox from '../../VCheckbox'
import VIcon from '../../VIcon'

import { h, unref } from 'vue'

function wrapInArray (value) {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

export default function useDataTableHead (props, { slots }, options) {
  const {
    computedPagination,
    expanded,
    genTR,
    genTProgress,
    hasSelectAll,
    hasTag,
    indeterminate,
    toggle,
    sort,
    everyItem,
    vm
  } = options

  function genTHead () {
    if (props.hideHeaders) return null

    if (slots.headers) {
      const slot = slots.headers({
        headers: props.headers,
        indeterminate: unref(indeterminate),
        all: unref(everyItem)
      })
      const normalizedSlot = wrapInArray(slot)
      const row = hasTag(normalizedSlot, 'th') ? genTR(normalizedSlot) : normalizedSlot
      const progress = genTProgress()
      return h('thead', [row, progress])
    }

    const row = props.headers.map((header, index) => {
      const key = props.headerKey ? header[props.headerKey] : index
      return genHeader(header, key)
    })

    if (unref(hasSelectAll)) {
      row.unshift(h('th', [
        h(VCheckbox, {
          dark: props.dark,
          light: props.light,
          color: props.selectAll === true ? undefined : props.selectAll,
          hideDetails: true,
          inputValue: unref(everyItem),
          indeterminate: unref(indeterminate),
          onChange: toggle
        })
      ]))
    }

    const progress = genTProgress()

    return h('thead', [genTR(row), progress])
  }

  function genHeader (header, key) {
    const headerSlot = slots.headerCell
    const children = headerSlot
      ? wrapInArray(headerSlot({ header }))
      : [header[props.headerText]]

    const { data, children: headerChildren } = genHeaderData(header, children, key)

    return h('th', data, headerChildren)
  }

  function genHeaderData (header, children, key) {
    const classes = ['column']
    const data = {
      key,
      role: 'columnheader',
      scope: 'col',
      width: header.width || undefined,
      'aria-label': header[props.headerText] || '',
      'aria-sort': 'none'
    }

    if (header.sortable == null || header.sortable) {
      genHeaderSortingData(header, children, data, classes)
    } else {
      data['aria-label'] += ': Not sorted.'
    }

    classes.push(`text-xs-${header.align || 'left'}`)

    if (Array.isArray(header.class)) {
      classes.push(...header.class)
    } else if (header.class) {
      classes.push(header.class)
    }

    data.class = classes

    return { data, children }
  }

  function genHeaderSortingData (header, children, data, classes) {
    if (!('value' in header)) {
      consoleWarn('Headers must have a value property that corresponds to a value in the v-model array', vm)
      return
    }

    data.tabindex = 0
    data.onClick = () => {
      Object.keys(expanded).forEach(key => { delete expanded[key] })
      sort(header.value)
    }
    data.onKeydown = e => {
      if (e.keyCode === 32) {
        e.preventDefault()
        sort(header.value)
      }
    }

    classes.push('sortable')

    const icon = h(VIcon, { small: true }, { default: () => props.sortIcon })

    if (!header.align || header.align === 'left') {
      children.push(icon)
    } else {
      children.unshift(icon)
    }

    const pagination = unref(computedPagination)
    const beingSorted = pagination.sortBy === header.value

    if (beingSorted) {
      classes.push('active')

      if (pagination.descending) {
        classes.push('desc')
        data['aria-sort'] = 'descending'
        data['aria-label'] += ': Sorted descending. Activate to remove sorting.'
      } else {
        classes.push('asc')
        data['aria-sort'] = 'ascending'
        data['aria-label'] += ': Sorted ascending. Activate to sort descending.'
      }
    } else {
      data['aria-label'] += ': Not sorted. Activate to sort ascending.'
    }
  }

  return {
    genTHead,
    genHeader,
    genHeaderData,
    genHeaderSortingData
  }
}
