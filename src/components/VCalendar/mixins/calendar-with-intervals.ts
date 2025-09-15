import { defineComponent, ref } from 'vue'

// Composables
import useCalendarWithIntervals from '../../../composables/useCalendarWithIntervals'

// Util
import props from '../util/props'

export default defineComponent({
  name: 'calendar-with-intervals',

  props: {
    ...props.base,
    ...props.intervals,
  },

  setup (props, { emit }) {
    const scrollArea = ref<HTMLElement>()

    const calendar = useCalendarWithIntervals(props, { emit, refs: { scrollArea } })

    return {
      scrollArea,
      ...calendar,
    }
  },
})
