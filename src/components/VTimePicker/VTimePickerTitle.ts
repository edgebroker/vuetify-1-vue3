import "@/css/vuetify.css"

// Composables
import usePickerButton, { pickerButtonProps } from '../../composables/usePickerButton'

// Utils
import { pad } from '../VDatePicker/util'

import { selectingTimes } from './VTimePicker'

// Types
import { defineComponent, h, PropType } from 'vue'

export default defineComponent({
  name: 'v-time-picker-title',

  props: {
    ...pickerButtonProps,
    ampm: Boolean,
    disabled: Boolean,
    hour: Number,
    minute: Number,
    second: Number,
    period: {
      type: String as PropType<'am' | 'pm'>,
      validator: period => period === 'am' || period === 'pm',
    },
    readonly: Boolean,
    useSeconds: Boolean,
    selecting: Number,
  },

  setup (props, { emit }) {
    const { genPickerButton } = usePickerButton(props, { emit })

    function genTime () {
      let hour = props.hour
      if (props.ampm) {
        hour = hour ? ((hour - 1) % 12 + 1) : 12
      }

      const displayedHour = props.hour == null ? '--' : props.ampm ? String(hour) : pad(hour)
      const displayedMinute = props.minute == null ? '--' : pad(props.minute)
      const titleContent = [
        genPickerButton('selecting', selectingTimes.hour, displayedHour, props.disabled),
        h('span', ':'),
        genPickerButton('selecting', selectingTimes.minute, displayedMinute, props.disabled),
      ]

      if (props.useSeconds) {
        const displayedSecond = props.second == null ? '--' : pad(props.second)
        titleContent.push(h('span', ':'))
        titleContent.push(genPickerButton('selecting', selectingTimes.second, displayedSecond, props.disabled))
      }

      return h('div', {
        class: 'v-time-picker-title__time',
      }, titleContent)
    }

    function genAmPm () {
      return h('div', {
        class: 'v-time-picker-title__ampm',
      }, [
        genPickerButton('period', 'am', 'am', props.disabled || props.readonly),
        genPickerButton('period', 'pm', 'pm', props.disabled || props.readonly),
      ])
    }

    return () => {
      const children = [genTime()]

      if (props.ampm) children.push(genAmPm())

      return h('div', {
        class: 'v-time-picker-title',
      }, children)
    }
  }
})
