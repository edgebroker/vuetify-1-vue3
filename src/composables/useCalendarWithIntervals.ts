import { computed } from 'vue'
import useCalendarBase from './useCalendarBase'
import {
  VTimestamp,
  VTime,
  VTimestampFormatter,
  parseTime,
  copyTimestamp,
  updateMinutes,
  createDayList,
  createIntervalList,
  createNativeLocaleFormatter
} from '../components/VCalendar/util/timestamp'

export default function useCalendarWithIntervals (props: any, context) {
  const base = useCalendarBase(props, context)

  const parsedFirstInterval = computed(() => parseInt(props.firstInterval))
  const parsedIntervalMinutes = computed(() => parseInt(props.intervalMinutes))
  const parsedIntervalCount = computed(() => parseInt(props.intervalCount))
  const parsedIntervalHeight = computed(() => parseFloat(props.intervalHeight))
  const firstMinute = computed(() => parsedFirstInterval.value * parsedIntervalMinutes.value)
  const bodyHeight = computed(() => parsedIntervalCount.value * parsedIntervalHeight.value)
  const days = computed(() => createDayList(
    base.parsedStart.value,
    base.parsedEnd.value,
    base.times.value.today,
    base.weekdaySkips.value,
    props.maxDays
  ))
  const intervals = computed(() => {
    const daysVal: VTimestamp[] = days.value
    const first = parsedFirstInterval.value
    const minutes = parsedIntervalMinutes.value
    const count = parsedIntervalCount.value
    const now = base.times.value.now
    return daysVal.map(d => createIntervalList(d, first, minutes, count, now))
  })

  const intervalFormatter = computed(() => {
    if (props.intervalFormat) return props.intervalFormat as VTimestampFormatter
    const longOptions = { timeZone: 'UTC', hour12: true, hour: '2-digit', minute: '2-digit' }
    const shortOptions = { timeZone: 'UTC', hour12: true, hour: 'numeric', minute: '2-digit' }
    const shortHourOptions = { timeZone: 'UTC', hour12: true, hour: 'numeric' }
    return createNativeLocaleFormatter(
      props.locale,
      (tms, short) => short ? (tms.minute === 0 ? shortHourOptions : shortOptions) : longOptions
    )
  })

  function showIntervalLabelDefault (interval: VTimestamp): boolean {
    const first: VTimestamp = intervals.value[0][0]
    const isFirst: boolean = first.hour === interval.hour && first.minute === interval.minute
    return !isFirst && interval.minute === 0
  }

  function intervalStyleDefault (_interval: VTimestamp): object | undefined {
    return undefined
  }

  function getTimestampAtEvent (e: MouseEvent | TouchEvent, day: VTimestamp): VTimestamp {
    const timestamp: VTimestamp = copyTimestamp(day)
    const bounds = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const baseMinutes: number = firstMinute.value
    const touchEvent: TouchEvent = e as TouchEvent
    const mouseEvent: MouseEvent = e as MouseEvent
    const touches: TouchList = touchEvent.changedTouches || touchEvent.touches
    const clientY: number = touches && touches[0] ? touches[0].clientY : mouseEvent.clientY
    const addIntervals: number = (clientY - bounds.top) / parsedIntervalHeight.value
    const addMinutes: number = Math.floor(addIntervals * parsedIntervalMinutes.value)
    const minutes: number = baseMinutes + addMinutes
    return updateMinutes(timestamp, minutes, base.times.value.now)
  }

  function getSlotScope (timestamp: VTimestamp): any {
    const scope = copyTimestamp(timestamp) as any
    scope.timeToY = timeToY
    scope.minutesToPixels = minutesToPixels
    return scope
  }

  function scrollToTime (time: VTime): boolean {
    const y = timeToY(time)
    const refOrEl: any = context.refs?.scrollArea
    const pane: HTMLElement | undefined = refOrEl && 'value' in refOrEl ? refOrEl.value : refOrEl
    if (y === false || !pane) return false
    pane.scrollTop = y
    return true
  }

  function minutesToPixels (minutes: number): number {
    return minutes / parsedIntervalMinutes.value * parsedIntervalHeight.value
  }

  function timeToY (time: VTime, clamp = true): number | false {
    const minutes = parseTime(time)
    if (minutes === false) return false
    const min = firstMinute.value
    const gap = parsedIntervalCount.value * parsedIntervalMinutes.value
    const delta = (minutes - min) / gap
    let y = delta * bodyHeight.value
    if (clamp) {
      if (y < 0) y = 0
      if (y > bodyHeight.value) y = bodyHeight.value
    }
    return y
  }

  return {
    ...base,
    parsedFirstInterval,
    parsedIntervalMinutes,
    parsedIntervalCount,
    parsedIntervalHeight,
    firstMinute,
    bodyHeight,
    days,
    intervals,
    intervalFormatter,
    showIntervalLabelDefault,
    intervalStyleDefault,
    getTimestampAtEvent,
    getSlotScope,
    scrollToTime,
    minutesToPixels,
    timeToY
  }
}

