import '@/css/vuetify.css'

// Components
import VIcon from '../VIcon'

// Composables
import usePickerButton, { pickerButtonProps } from '../../composables/usePickerButton'

// Types
import { defineComponent, h, ref, computed, watch } from 'vue'

export default defineComponent({
  name: 'v-date-picker-title',

  props: {
    ...pickerButtonProps,
    date: {
      type: String,
      default: ''
    },
    disabled: Boolean,
    readonly: Boolean,
    selectingYear: Boolean,
    value: {
      type: String
    },
    year: {
      type: [Number, String],
      default: ''
    },
    yearIcon: {
      type: String
    }
  },

  setup (props, { emit }) {
    const isReversing = ref(false)
    const { genPickerButton } = usePickerButton(props, { emit })

    const computedTransition = computed(() =>
      isReversing.value ? 'picker-reverse-transition' : 'picker-transition'
    )

    watch(() => props.value, (val, prev) => {
      isReversing.value = val < prev
    })

    function genYearIcon () {
      return h(VIcon, { dark: true }, () => props.yearIcon)
    }

    function getYearBtn () {
      return genPickerButton('selectingYear', true, [
        String(props.year),
        props.yearIcon ? genYearIcon() : null
      ], false, 'v-date-picker-title__year')
    }

    function genTitleText () {
      return h('transition', { name: computedTransition.value }, {
        default: () => [
          h('div', { innerHTML: props.date || '&nbsp;', key: props.value })
        ]
      })
    }

    function genTitleDate () {
      return genPickerButton('selectingYear', false, [genTitleText()], false, 'v-date-picker-title__date')
    }

    return () => h('div', {
      class: {
        'v-date-picker-title': true,
        'v-date-picker-title--disabled': props.disabled
      }
    }, [
      getYearBtn(),
      genTitleDate()
    ])
  }
})
