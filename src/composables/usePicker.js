import { h } from 'vue'
import VPicker from '../components/VPicker'

export const pickerProps = {
  fullWidth: Boolean,
  headerColor: String,
  landscape: Boolean,
  noTitle: Boolean,
  width: {
    type: [Number, String],
    default: 290
  }
}

export default function usePicker (props, { slots, save, cancel } = {}) {
  function genPickerTitle () {
    return null
  }

  function genPickerBody () {
    return null
  }

  function genPickerActionsSlot () {
    return slots && slots.default ? slots.default({ save, cancel }) : undefined
  }

  function genPicker (staticClass) {
    const pickerSlots = {}

    if (!props.noTitle) {
      const title = genPickerTitle()
      if (title) pickerSlots.title = () => title
    }

    const body = genPickerBody()
    if (body) pickerSlots.default = () => body

    const actions = genPickerActionsSlot()
    if (actions) pickerSlots.actions = () => actions

    return h(VPicker, {
      class: staticClass,
      color: props.headerColor || props.color,
      dark: props.dark,
      fullWidth: props.fullWidth,
      landscape: props.landscape,
      light: props.light,
      width: props.width
    }, pickerSlots)
  }

  return {
    genPickerTitle,
    genPickerBody,
    genPickerActionsSlot,
    genPicker
  }
}
