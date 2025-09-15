import '@/css/vuetify.css'

// Components
import VIcon from '../VIcon'

// Composables
import useColorable, { colorProps } from '../../composables/useColorable'
import useThemeable, { themeProps } from '../../composables/useThemeable'
import useToggleable from '../../composables/useToggleable'

// Types
import { defineComponent, h, computed } from 'vue'

export default defineComponent({
  name: 'v-chip',

  props: {
    close: Boolean,
    disabled: Boolean,
    label: Boolean,
    outline: Boolean,
    // Used for selects/tagging
    selected: Boolean,
    small: Boolean,
    textColor: String,
    value: {
      type: Boolean,
      default: true
    },
    ...colorProps,
    ...themeProps
  },

  setup (props, { slots, attrs, emit }) {
    const { setBackgroundColor, setTextColor } = useColorable(props)
    const { themeClasses } = useThemeable(props)
    const { isActive } = useToggleable(props, emit)

    const classes = computed(() => ({
      'v-chip--disabled': props.disabled,
      'v-chip--selected': props.selected && !props.disabled,
      'v-chip--label': props.label,
      'v-chip--outline': props.outline,
      'v-chip--small': props.small,
      'v-chip--removable': props.close,
      ...themeClasses.value
    }))

    function genClose () {
      const on = {
        click: (e: Event) => {
          e.stopPropagation()
          emit('input', false)
        }
      }
      return h('div', { class: 'v-chip__close', on }, [
        h(VIcon, '$vuetify.icons.delete')
      ])
    }

    function genContent () {
      return h('span', { class: 'v-chip__content' }, [
        slots.default?.(),
        props.close && genClose()
      ])
    }

    return () => {
      const data = setBackgroundColor(props.color, {
        class: ['v-chip', classes.value],
        tabindex: props.disabled ? -1 : 0,
        directives: [{ name: 'show', value: isActive.value }],
        ...attrs
      })

      const color = props.textColor || (props.outline && props.color)
      return h('span', setTextColor(color, data), [genContent()])
    }
  }
})

