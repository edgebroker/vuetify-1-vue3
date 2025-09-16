import { h, unref } from 'vue'

function wrapInArray (value) {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

function containsTag (elements, tag) {
  return elements.some(node => {
    if (!node || Array.isArray(node)) return false
    return typeof node.type === 'string' && node.type === tag
  })
}

export default function useDataTableFoot (props, { slots }, options) {
  const {
    classes,
    genActions,
    genTR
  } = options

  function genTFoot () {
    if (!slots.footer) return null

    const footer = slots.footer()
    if (!footer) return null

    const normalizedFooter = wrapInArray(footer)
    const hasCells = containsTag(normalizedFooter, 'td')
    const row = hasCells
      ? [genTR(normalizedFooter)]
      : normalizedFooter

    return h('tfoot', row)
  }

  function genActionsFooter () {
    if (props.hideActions || typeof genActions !== 'function') return null

    const classData = unref(classes)
    return h('div', { class: classData }, [genActions()])
  }

  return {
    genTFoot,
    genActionsFooter
  }
}
