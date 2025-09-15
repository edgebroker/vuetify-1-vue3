// Styles
import '@/css/vuetify.css'

// Components
import VIcon from '../VIcon'

// Composables
import useSelectable, { selectableProps } from '../../composables/useSelectable'
import useRippleable, { rippleableProps } from '../../composables/useRippleable'
import useThemeable, { themeProps } from '../../composables/useThemeable'
import useColorable from '../../composables/useColorable'

// Types
import { defineComponent, h, ref, computed, watch } from 'vue'

export default defineComponent({
  name: 'v-checkbox',

  props: {
    indeterminate: Boolean,
    indeterminateIcon: {
      type: String,
      default: '$vuetify.icons.checkboxIndeterminate'
    },
    onIcon: {
      type: String,
      default: '$vuetify.icons.checkboxOn'
    },
    offIcon: {
      type: String,
      default: '$vuetify.icons.checkboxOff'
    },
    ...selectableProps,
    ...rippleableProps,
    ...themeProps
  },

  setup (props, { attrs, slots, emit }) {
    const { genInput, genLabel, isActive, computedColor, onChange } = useSelectable(props, { emit })
    const { genRipple } = useRippleable(props, { onChange })
    const { setTextColor } = useColorable(props)
    const { themeClasses } = useThemeable(props)

    const inputIndeterminate = ref(props.indeterminate)
    watch(() => props.indeterminate, val => { inputIndeterminate.value = val })

    const classes = computed(() => ({
      'v-input--selection-controls': true,
      'v-input--checkbox': true,
      ...themeClasses.value
    }))

    const computedIcon = computed(() => {
      if (inputIndeterminate.value) return props.indeterminateIcon
      return isActive.value ? props.onIcon : props.offIcon
    })

    function genCheckbox () {
      return h('div', { class: 'v-input--selection-controls__input' }, [
        genInput('checkbox', {
          ...attrs,
          'aria-checked': inputIndeterminate.value ? 'mixed' : String(isActive.value)
        }),
        genRipple(setTextColor(computedColor.value)),
        h(VIcon, setTextColor(computedColor.value, {
          props: { dark: props.dark, light: props.light }
        }), { default: () => computedIcon.value })
      ])
    }

    return () => h('div', { class: classes.value }, [
      genCheckbox(),
      genLabel()
    ])
  }
})

