import ExpandTransitionGenerator from '../../transitions/expand-transition'

import { getObjectValueByPath } from '../../../util/helpers'

import { h, TransitionGroup, unref } from 'vue'

function wrapInArray (value) {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

export default function useDataTableBody (props, { slots }, options) {
  const {
    headerColumns,
    itemKey,
    isExpanded,
    isSelected,
    filteredItems,
    createProps,
    genTR,
    hasTag
  } = options

  function genExpandedRow (itemProps) {
    const expandSlot = slots.expand
    if (!expandSlot) return null

    const expanded = isExpanded(itemProps.item)
    const children = []

    if (expanded) {
      const key = itemKey ? getObjectValueByPath(itemProps.item, itemKey) : itemProps.index
      const content = wrapInArray(expandSlot(itemProps))
      children.push(h('div', {
        class: 'v-datatable__expand-content',
        key
      }, content))
    }

    const transitionHooks = ExpandTransitionGenerator('v-datatable__expand-col--expanded')

    const transition = h(TransitionGroup, {
      class: {
        'v-datatable__expand-col': true,
        'v-datatable__expand-col--expanded': expanded
      },
      tag: 'td',
      colspan: unref(headerColumns),
      onBeforeEnter: transitionHooks.beforeEnter,
      onEnter: transitionHooks.enter,
      onAfterEnter: transitionHooks.afterEnter,
      onEnterCancelled: transitionHooks.enterCancelled,
      onLeave: transitionHooks.leave,
      onAfterLeave: transitionHooks.afterLeave,
      onLeaveCancelled: transitionHooks.leaveCancelled
    }, children)

    return genTR([transition], { class: 'v-datatable__expand-row' })
  }

  function genFilteredItems () {
    const itemsSlot = slots.items || slots.item
    if (!itemsSlot) return null

    const rows = []
    const items = unref(filteredItems) || []

    for (let index = 0; index < items.length; ++index) {
      const item = items[index]
      const propsOut = createProps(item, index)
      const row = itemsSlot(propsOut)
      if (!row) continue

      const normalizedRow = wrapInArray(row)
      const wrappedRow = hasTag(normalizedRow, 'td')
        ? genTR(normalizedRow, {
          key: itemKey ? getObjectValueByPath(propsOut.item, itemKey) : index,
          attrs: { active: isSelected(item) }
        })
        : row

      rows.push(wrappedRow)

      if (slots.expand) {
        const expandRow = genExpandedRow(propsOut)
        if (expandRow) rows.push(expandRow)
      }
    }

    return rows
  }

  function genEmptyItems (content) {
    if (!content) return []

    const normalizedContent = wrapInArray(content)

    if (hasTag(normalizedContent, 'tr')) {
      return normalizedContent
    }

    if (hasTag(normalizedContent, 'td')) {
      return [genTR(normalizedContent)]
    }

    const td = h('td', {
      class: { 'text-xs-center': normalizedContent.length === 1 && typeof normalizedContent[0] === 'string' },
      colspan: unref(headerColumns)
    }, normalizedContent)

    return [genTR([td])]
  }

  function genItems () {
    const rows = genFilteredItems()
    if (rows && rows.length) return rows

    const emptyContent = slots['no-results'] ? slots['no-results']() : props.noResultsText
    return genEmptyItems(emptyContent)
  }

  function genTBody () {
    const children = genItems()
    return h('tbody', children)
  }

  return {
    genTBody,
    genExpandedRow,
    genFilteredItems,
    genEmptyItems
  }
}
