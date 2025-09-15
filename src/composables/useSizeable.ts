import { toRefs } from 'vue'

export const sizeableProps = {
  large: Boolean,
  medium: Boolean,
  size: [Number, String],
  small: Boolean,
  xLarge: Boolean,
}

export default function useSizeable (props) {
  const { large, medium, size, small, xLarge } = toRefs(props)

  return { large, medium, size, small, xLarge }
}

