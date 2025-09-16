// Styles
import '@/css/vuetify.css'

// Types
import { defineComponent, h, ref, computed, nextTick, onMounted } from 'vue'

// Directives
import Resize from '../../directives/resize'

// Composables
import useCalendarWithIntervals from './composables/useCalendarWithIntervals'

// Util
import props from './util/props'

const dailyProps = {
  ...props.base,
  ...props.intervals
}

export default defineComponent({
  name: 'v-calendar-daily',

  directives: { Resize },

  props: dailyProps,

  setup (props, { slots, emit }) {
    const scrollArea = ref<HTMLElement>()
    const calendar = useCalendarWithIntervals(props, { emit, refs: { scrollArea } })

    function onResize () {}

    onMounted(() => nextTick(onResize))

    const classes = computed(() => ({
      'v-calendar-daily': true,
      ...calendar.themeClasses.value
    }))

    // TODO: implement full daily calendar rendering

    return () => h('div', {
      class: classes.value,
      directives: [{ name: 'resize', modifiers: { quiet: true }, value: onResize }]
    }, slots.default?.())
  }
})

