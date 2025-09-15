import { h } from 'vue'
import VProgressLinear from '../components/VProgressLinear'

export const loadableProps = {
  loading: {
    type: [Boolean, String],
    default: false
  }
}

export default function useLoadable (props, { slots }) {
  function genProgress () {
    if (!props.loading) return null

    if (slots.progress) return slots.progress()

    const color = props.loading === true || props.loading === ''
      ? props.color || 'primary'
      : props.loading

    return h(VProgressLinear, {
      color,
      height: 2,
      indeterminate: true
    })
  }

  return { genProgress }
}
