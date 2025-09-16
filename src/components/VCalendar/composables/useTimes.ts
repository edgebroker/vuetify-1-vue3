import { ref, computed, watch, onMounted } from 'vue'
import { VTimestamp, parseTimestamp, parseDate } from '../util/timestamp'

export interface TimesProps {
  now?: string
}

export default function useTimes (props: TimesProps) {
  const times = ref({
    now: parseTimestamp('0000-00-00 00:00') as VTimestamp,
    today: parseTimestamp('0000-00-00') as VTimestamp
  })

  const parsedNow = computed(() => props.now ? parseTimestamp(props.now) : null)

  function setPresent () {
    times.value.now.present = times.value.today.present = true
    times.value.now.past = times.value.today.past = false
    times.value.now.future = times.value.today.future = false
  }

  function updateDay (now: VTimestamp, target: VTimestamp) {
    if (now.date !== target.date) {
      target.year = now.year
      target.month = now.month
      target.day = now.day
      target.weekday = now.weekday
      target.date = now.date
    }
  }

  function updateTime (now: VTimestamp, target: VTimestamp) {
    if (now.time !== target.time) {
      target.hour = now.hour
      target.minute = now.minute
      target.time = now.time
    }
  }

  function getNow (): VTimestamp {
    return parseDate(new Date())
  }

  function updateTimes () {
    const now = parsedNow.value || getNow()
    updateDay(now, times.value.now)
    updateTime(now, times.value.now)
    updateDay(now, times.value.today)
  }

  watch(parsedNow, updateTimes)

  onMounted(() => {
    updateTimes()
    setPresent()
  })

  return { times, parsedNow, setPresent, updateTimes, getNow, updateDay, updateTime }
}
