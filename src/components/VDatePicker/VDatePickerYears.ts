import '@/css/vuetify.css'

// Utils
import { createNativeLocaleFormatter } from './util'

// Composables
import useColorable, { colorProps } from '../../composables/useColorable'

// Types
import { defineComponent, h, ref, computed, onMounted } from 'vue'
import { PropType } from 'vue'
import { DatePickerFormatter } from './util/createNativeLocaleFormatter'

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

    const formatter = computed(() =>
      props.format || createNativeLocaleFormatter(props.locale, { year: 'numeric', timeZone: 'UTC' }, { length: 4 })
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
      const active = parseInt(String(props.value), 10) === year
      const color = active && (props.color || 'primary')

      return h('li', setTextColor(color, {
        key: year,
        class: { active },
        onClick: () => emit('input', year)
      }), formatted)
    }

    function genYearItems () {
      const children = [] as any[]
      const selectedYear = props.value ? parseInt(String(props.value), 10) : new Date().getFullYear()
      const maxYear = props.max ? parseInt(String(props.max), 10) : selectedYear + 100
      const minYear = Math.min(maxYear, props.min ? parseInt(String(props.min), 10) : selectedYear - 100)

      for (let year = maxYear; year >= minYear; year--) {
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
