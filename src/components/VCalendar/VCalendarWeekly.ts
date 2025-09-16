// Styles
import '@/css/vuetify.css'

// Types
import { defineComponent, h, computed } from 'vue'

// Composables
import useCalendarBase from './composables/useCalendarBase'

// Util
import props from './util/props'

const weeklyProps = {
  ...props.base,
  ...props.weeks
}

export default defineComponent({
  name: 'v-calendar-weekly',

  props: weeklyProps,

  setup (props, { slots, emit }) {
    const base = useCalendarBase(props, { emit })

    const classes = computed(() => ({
      'v-calendar-weekly': true,
      ...base.themeClasses.value
    }))

    // TODO: implement weekly calendar rendering

    return () => h('div', { class: classes.value }, slots.default?.())
  }
})

