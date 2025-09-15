import { defineComponent } from 'vue'

// Composables
import useCalendarBase from '../../../composables/useCalendarBase'

// Util
import props from '../util/props'
import { validateTimestamp } from '../util/timestamp'

export default defineComponent({
  name: 'calendar-base',

  props: {
    ...props.base,
    now: {
      type: String,
      validator: validateTimestamp,
    },
  },

  setup (props, { emit }) {
    const calendar = useCalendarBase(props, { emit })

    return {
      ...calendar,
    }
  },
})
