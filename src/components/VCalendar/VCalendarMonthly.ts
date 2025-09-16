// Styles
import '@/css/vuetify.css'

// Types
import { defineComponent, h, computed } from 'vue'

// Util
import { parseTimestamp, getStartOfMonth, getEndOfMonth } from './util/timestamp'
import props from './util/props'

// Components
import VCalendarWeekly from './VCalendarWeekly'

const monthlyProps = {
  ...props.base,
  ...props.weeks
}

export const VCalendarMonthly = defineComponent({
  name: 'v-calendar-monthly',

  props: monthlyProps,

  setup (props, { slots }) {
    const parsedStart = computed(() => getStartOfMonth(parseTimestamp(props.start)!))
    const parsedEnd = computed(() => getEndOfMonth(parseTimestamp(props.end)!))

    return () => h(VCalendarWeekly as any, {
      ...props,
      start: parsedStart.value.date,
      end: parsedEnd.value.date
    }, slots)
  }
})

export default VCalendarMonthly

