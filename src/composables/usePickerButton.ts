import { h } from 'vue'
import useColorable, { colorProps } from './useColorable'

export const pickerButtonProps = {
  ...colorProps
}

export default function usePickerButton (props, { emit }) {
  const { setTextColor } = useColorable(props)

  function genPickerButton (prop, value, content, readonly = false, staticClass = '') {
    const active = props[prop] === value

    const data = setTextColor(active ? props.color : undefined, {
      class: {
        'v-picker__title__btn--active': active,
        'v-picker__title__btn--readonly': readonly
      }
    })

    return h('div', {
      class: [
        'v-picker__title__btn',
        staticClass,
        data.class
      ],
      style: data.style,
      onClick: (active || readonly) ? undefined : (event) => {
        event.stopPropagation()
        emit(`update:${prop}`, value)
      }
    }, Array.isArray(content) ? content : [content])
  }

  return { genPickerButton }
}
