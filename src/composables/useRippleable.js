import { h, withDirectives } from 'vue'
import Ripple from '../directives/ripple'

export const rippleableProps = {
  ripple: {
    type: [Boolean, Object],
    default: true,
  },
}

export default function useRippleable (props, { onChange = () => {} } = {}) {
  function genRipple (data = {}) {
    if (!props.ripple) return null

    const {
      class: className,
      directives = [],
      ...rest
    } = data

    const node = h('div', {
      ...rest,
      class: ['v-input--selection-controls__ripple', className],
      onClick: onChange,
    })

    return withDirectives(node, [
      ...directives,
      [Ripple, typeof props.ripple === 'object' ? props.ripple : { center: true }],
    ])
  }

  return { genRipple }
}

