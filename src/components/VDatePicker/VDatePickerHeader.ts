import '@/css/vuetify.css'

// Components
import VBtn from '../VBtn'
import VIcon from '../VIcon'

// Composables
import useColorable, { colorProps } from '../../composables/useColorable'
import useThemeable, { themeProps } from '../../composables/useThemeable'

// Utils
import { createNativeLocaleFormatter, monthChange } from './util'

// Types
import { computed, defineComponent, getCurrentInstance, h, PropType, ref, Transition, watch } from 'vue'
import type { DatePickerFormatter } from './util/createNativeLocaleFormatter'

export default defineComponent({
  name: 'v-date-picker-header',

  props: {
    ...colorProps,
    ...themeProps,
    disabled: Boolean,
    format: Function as PropType<DatePickerFormatter | undefined>,
    locale: {
      type: String,
      default: 'en-us',
    },
    min: String,
    max: String,
    nextIcon: {
      type: String,
      default: '$vuetify.icons.next',
    },
    prevIcon: {
      type: String,
      default: '$vuetify.icons.prev',
    },
    readonly: Boolean,
    value: {
      type: [Number, String],
      required: true,
    },
  },

  emits: ['input', 'toggle'],

  setup (props, { emit, slots }) {
    const { themeClasses } = useThemeable(props)
    const { setTextColor } = useColorable(props)

    const vm = getCurrentInstance()
    const isRtl = computed(() => Boolean(vm?.proxy?.$vuetify?.rtl))

    const isReversing = ref(false)

    watch(() => props.value, (newVal, oldVal) => {
      isReversing.value = newVal < oldVal
    })

    const formatter = computed<DatePickerFormatter>(() => {
      if (props.format) {
        return props.format as DatePickerFormatter
      } else if (String(props.value).split('-')[1]) {
        return createNativeLocaleFormatter(props.locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }, { length: 7 })
      } else {
        return createNativeLocaleFormatter(props.locale, { year: 'numeric', timeZone: 'UTC' }, { length: 4 })
      }
    })

    const transitionName = computed(() => (isReversing.value === !isRtl.value) ? 'tab-reverse-transition' : 'tab-transition')

    const color = computed(() => !props.disabled && (props.color || 'accent'))

    function calculateChange (sign: number) {
      const [year, month] = String(props.value).split('-').map(Number)

      if (Number.isNaN(month) || month == null) {
        return `${year + sign}`
      } else {
        return monthChange(String(props.value), sign)
      }
    }

    function genBtn (change: number) {
      const target = calculateChange(change)
      const disabled = props.disabled ||
        (change < 0 && props.min && target < props.min) ||
        (change > 0 && props.max && target > props.max)

      return h(VBtn, {
        dark: props.dark,
        disabled,
        icon: true,
        light: props.light,
        onClick: (e: Event) => {
          e.stopPropagation()
          emit('input', target)
        },
      }, {
        default: () => h(VIcon, (change < 0) === !isRtl.value ? props.prevIcon : props.nextIcon),
      })
    }

    function genHeader () {
      const headerContent = h('button', {
        type: 'button',
        onClick: () => emit('toggle'),
      }, slots.default?.() ?? formatter.value(String(props.value)))

      const colorData = setTextColor(color.value, { class: {}, style: {} } as Record<string, any>)

      const header = h('div', {
        key: String(props.value),
        class: colorData.class,
        style: colorData.style,
      }, [headerContent])

      const transition = h(Transition, { name: transitionName.value }, {
        default: () => [header],
      })

      return h('div', {
        class: [
          'v-date-picker-header__value',
          {
            'v-date-picker-header__value--disabled': props.disabled,
          },
        ],
      }, [transition])
    }

    return () => h('div', {
      class: [
        'v-date-picker-header',
        {
          'v-date-picker-header--disabled': props.disabled,
        },
        themeClasses.value,
      ],
    }, [
      genBtn(-1),
      genHeader(),
      genBtn(+1),
    ])
  },
})
