import '@/css/vuetify.css'

// Utils
import { createNativeLocaleFormatter } from './util'

// Composables
import useColorable, { colorProps } from '../../composables/useColorable'

// Types
import { defineComponent, h, ref, computed, onMounted } from 'vue'
import type { PropType, VNode } from 'vue'
import type { DatePickerFormatter } from './util/createNativeLocaleFormatter'

export default defineComponent({
  name: 'v-date-picker-years',

  props: {
    ...colorProps,
    format: Function as PropType<DatePickerFormatter | undefined>,
    locale: {
      type: String,
      default: 'en-us'
    },
    min: [Number, String],
    max: [Number, String],
    readonly: Boolean,
    value: [Number, String]
  },

  setup (props, { emit }) {
    const years = ref<HTMLElement | null>(null)
    const { setTextColor } = useColorable(props)

    const formatter = computed<DatePickerFormatter>(() =>
      props.format || createNativeLocaleFormatter(props.locale, { year: 'numeric', timeZone: 'UTC' }, { length: 4 })
    )
    const parsedValue = computed<number | null>(() =>
      props.value != null ? parseInt(String(props.value), 10) : null
    )
    const fallbackYear = computed(() => parsedValue.value ?? new Date().getFullYear())
    const maxYear = computed(() =>
      props.max != null ? parseInt(String(props.max), 10) : fallbackYear.value + 100
    )
    const minYear = computed(() =>
      Math.min(maxYear.value, props.min != null ? parseInt(String(props.min), 10) : fallbackYear.value - 100)
    )

    onMounted(() => {
      setTimeout(() => {
        const el = years.value
        if (!el) return
        const activeItem = el.getElementsByClassName('active')[0] as HTMLElement | undefined
        if (activeItem) {
          el.scrollTop = activeItem.offsetTop - el.offsetHeight / 2 + activeItem.offsetHeight / 2
        } else {
          el.scrollTop = el.scrollHeight / 2 - el.offsetHeight / 2
        }
      })
    })

    function genYearItem (year: number) {
      const formatted = formatter.value(String(year))
      const active = parsedValue.value === year
      const color = active && (props.color || 'primary')

      return h('li', setTextColor(color, {
        key: year,
        class: { active },
        onClick: () => emit('input', year)
      }), formatted)
    }

    function genYearItems () {
      const children: VNode[] = []

      for (let year = maxYear.value; year >= minYear.value; year--) {
        children.push(genYearItem(year))
      }
      return children
    }

    return () => h('ul', {
      class: 'v-date-picker-years',
      ref: years
    }, genYearItems())
  }
})
