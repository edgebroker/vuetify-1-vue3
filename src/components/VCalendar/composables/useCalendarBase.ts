import { computed } from 'vue'
import useColorable from '../../../composables/useColorable'
import useThemeable from '../../../composables/useThemeable'
import useTimes from './useTimes'
import useMouse, { type EmitFn } from './useMouse'
import {
  VTimestamp,
  VTimestampFormatter,
  parseTimestamp,
  getWeekdaySkips,
  createDayList,
  createNativeLocaleFormatter,
  getStartOfWeek,
  getEndOfWeek
} from '../util/timestamp'

export interface CalendarBaseContext {
  emit: EmitFn
}

export default function useCalendarBase (props: any, context: CalendarBaseContext) {
  const { emit } = context
  const { setTextColor } = useColorable(props)
  const { themeClasses } = useThemeable(props)
  const { times } = useTimes(props)
  const { getDefaultMouseEventHandlers, getMouseEventHandlers } = useMouse(emit)

  const weekdaySkips = computed(() => getWeekdaySkips(props.weekdays))
  const parsedStart = computed(() => parseTimestamp(props.start) as VTimestamp)
  const parsedEnd = computed(() => parseTimestamp(props.end) as VTimestamp)
  const days = computed(() => createDayList(
    parsedStart.value,
    parsedEnd.value,
    times.value.today,
    weekdaySkips.value
  ))

  const dayFormatter = computed(() => {
    if (props.dayFormat) return props.dayFormat as VTimestampFormatter
    const options = { timeZone: 'UTC', day: 'numeric' }
    return createNativeLocaleFormatter(props.locale, () => options)
  })

  const weekdayFormatter = computed(() => {
    if (props.weekdayFormat) return props.weekdayFormat as VTimestampFormatter
    const longOptions = { timeZone: 'UTC', weekday: 'long' }
    const shortOptions = { timeZone: 'UTC', weekday: 'short' }
    return createNativeLocaleFormatter(props.locale, (_tms, short) => short ? shortOptions : longOptions)
  })

  function getRelativeClasses (timestamp: VTimestamp, outside = false): object {
    return {
      'v-present': timestamp.present,
      'v-past': timestamp.past,
      'v-future': timestamp.future,
      'v-outside': outside
    }
  }

  function getStartOfWeekFn (timestamp: VTimestamp): VTimestamp {
    return getStartOfWeek(timestamp, props.weekdays, times.value.today)
  }

  function getEndOfWeekFn (timestamp: VTimestamp): VTimestamp {
    return getEndOfWeek(timestamp, props.weekdays, times.value.today)
  }

  return {
    setTextColor,
    themeClasses,
    times,
    weekdaySkips,
    parsedStart,
    parsedEnd,
    days,
    dayFormatter,
    weekdayFormatter,
    getRelativeClasses,
    getStartOfWeek: getStartOfWeekFn,
    getEndOfWeek: getEndOfWeekFn,
    getDefaultMouseEventHandlers,
    getMouseEventHandlers
  }
}
