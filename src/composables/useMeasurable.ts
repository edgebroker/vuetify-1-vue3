import { computed } from 'vue'
import { convertToUnit } from '../util/helpers'

export const measurableProps = {
  height: [Number, String],
  maxHeight: [Number, String],
  maxWidth: [Number, String],
  minHeight: [Number, String],
  minWidth: [Number, String],
  width: [Number, String]
}

export default function useMeasurable (props) {
  const measurableStyles = computed(() => {
    const styles = {}

    const height = convertToUnit(props.height)
    const minHeight = convertToUnit(props.minHeight)
    const minWidth = convertToUnit(props.minWidth)
    const maxHeight = convertToUnit(props.maxHeight)
    const maxWidth = convertToUnit(props.maxWidth)
    const width = convertToUnit(props.width)

    if (height) styles.height = height
    if (minHeight) styles.minHeight = minHeight
    if (minWidth) styles.minWidth = minWidth
    if (maxHeight) styles.maxHeight = maxHeight
    if (maxWidth) styles.maxWidth = maxWidth
    if (width) styles.width = width

    return styles
  })

  return { measurableStyles }
}

