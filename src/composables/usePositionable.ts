import { computed } from 'vue'

const positionProps = {
  absolute: Boolean,
  bottom: Boolean,
  fixed: Boolean,
  left: Boolean,
  right: Boolean,
  top: Boolean
}

export function positionPropsFactory (selected = []) {
  if (!selected.length) return positionProps

  return selected.reduce((props, key) => {
    if (key in positionProps) props[key] = positionProps[key]
    return props
  }, {})
}

export default function usePositionable (props, selected = []) {
  const keys = selected.length ? selected : Object.keys(positionProps)

  const positionClasses = computed(() => {
    const classes = {}
    keys.forEach(key => {
      if (props[key]) classes[key] = true
    })
    return classes
  })

  return { positionClasses }
}

export { positionProps }
