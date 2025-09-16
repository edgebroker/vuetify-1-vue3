// Styles
import '@/css/vuetify.css'

// Types
import { defineComponent, h, ref, computed, watch } from 'vue'

// Composables
import useCalendarBase from './composables/useCalendarBase'

// Util
import props from './util/props'
import {
  DAYS_IN_MONTH_MAX,
  DAY_MIN,
  DAYS_IN_WEEK,
  VTimestamp,
  VTime,
  parseTimestamp,
  relativeDays,
  nextDay,
  prevDay,
  copyTimestamp,
  updateFormatted,
  updateWeekday,
  updateRelative,
  getStartOfMonth,
  getEndOfMonth
} from './util/timestamp'

// Calendars
import VCalendarMonthly from './VCalendarMonthly'
import VCalendarDaily from './VCalendarDaily'
import VCalendarWeekly from './VCalendarWeekly'

const calendarProps = {
  ...props.base,
  ...props.weeks,
  ...props.intervals,
  ...props.calendar
}

export default defineComponent({
  name: 'v-calendar',

  props: calendarProps,

  setup (props, { slots, emit, expose }) {
    const base = useCalendarBase(props, { emit })
    const calendarRef = ref()
    const lastStart = ref<VTimestamp | null>(null)
    const lastEnd = ref<VTimestamp | null>(null)

    const parsedValue = computed(() => {
      return parseTimestamp(props.value) ||
        base.parsedStart.value ||
        base.times.value.today
    })

    const renderProps = computed(() => {
      const around = parsedValue.value
      let component: any = 'div'
      let maxDays = props.maxDays
      let start = around
      let end = around
      switch (props.type) {
        case 'month':
          component = VCalendarMonthly
          start = getStartOfMonth(around)
          end = getEndOfMonth(around)
          break
        case 'week':
          component = VCalendarDaily
          start = base.getStartOfWeek(around)
          end = base.getEndOfWeek(around)
          maxDays = 7
          break
        case 'day':
          component = VCalendarDaily
          maxDays = 1
          break
        case '4day':
          component = VCalendarDaily
          end = relativeDays(copyTimestamp(end), nextDay, 4)
          updateFormatted(end)
          maxDays = 4
          break
        case 'custom-weekly':
          component = VCalendarWeekly
          start = base.parsedStart.value || around
          end = base.parsedEnd.value
          break
        case 'custom-daily':
          component = VCalendarDaily
          start = base.parsedStart.value || around
          end = base.parsedEnd.value
          break
      }
      return { component, start, end, maxDays }
    })

    function checkChange () {
      const { start, end } = renderProps.value
      if (start !== lastStart.value || end !== lastEnd.value) {
        lastStart.value = start
        lastEnd.value = end
        emit('change', { start, end })
      }
    }

    watch(renderProps, checkChange)

    function move (amount = 1) {
      const moved = copyTimestamp(parsedValue.value)
      const forward = amount > 0
      const mover = forward ? nextDay : prevDay
      const limit = forward ? DAYS_IN_MONTH_MAX : DAY_MIN
      let times = forward ? amount : -amount

      while (--times >= 0) {
        switch (props.type) {
          case 'month':
            moved.day = limit
            mover(moved)
            break
          case 'week':
            relativeDays(moved, mover, DAYS_IN_WEEK)
            break
          case 'day':
            mover(moved)
            break
          case '4day':
            relativeDays(moved, mover, 4)
            break
        }
      }

      updateWeekday(moved)
      updateFormatted(moved)
      updateRelative(moved, base.times.value.now)

      emit('input', moved.date)
      emit('moved', moved)
    }

    function next (amount = 1) {
      move(amount)
    }

    function prev (amount = 1) {
      move(-amount)
    }

    function timeToY (time: VTime, clamp = true): number | false {
      const c: any = calendarRef.value
      return c && c.timeToY ? c.timeToY(time, clamp) : false
    }

    function minutesToPixels (minutes: number): number {
      const c: any = calendarRef.value
      return c && c.minutesToPixels ? c.minutesToPixels(minutes) : -1
    }

    function scrollToTime (time: VTime): boolean {
      const c: any = calendarRef.value
      return c && c.scrollToTime ? c.scrollToTime(time) : false
    }

    expose({ timeToY, minutesToPixels, scrollToTime, next, prev, move })

    return () => {
      const { start, end, maxDays, component } = renderProps.value
      return h(component, {
        ref: calendarRef,
        staticClass: 'v-calendar',
        props: {
          ...props,
          start: start.date,
          end: end.date,
          maxDays
        },
        on: {
          'click:date': (day: VTimestamp) => {
            emit('input', day.date)
            emit('click:date', day)
          }
        }
      }, slots)
    }
  }
})

