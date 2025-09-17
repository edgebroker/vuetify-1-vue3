import "@/css/vuetify.css"

// Composables
import useColorable, { colorProps } from '../../composables/useColorable'
import useThemeable, { themeProps } from '../../composables/useThemeable'

// Helpers
import { convertToUnit } from '../../util/helpers'

// Types
import { defineComponent, h, computed } from 'vue'

export default defineComponent({
  name: 'v-picker',

  props: {
    fullWidth: Boolean,
    landscape: Boolean,
    transition: {
      type: String,
      default: 'fade-transition'
    },
    width: {
      type: [Number, String],
      default: 290
    },
    ...colorProps,
    ...themeProps
  },

  setup (props, { slots }) {
    const { setBackgroundColor } = useColorable(props)
    const { themeClasses, isDark } = useThemeable(props)

    const computedTitleColor = computed(() => {
      const defaultTitleColor = isDark.value ? false : (props.color || 'primary')
      return props.color || defaultTitleColor
    })

    const bodyStyles = computed(() => {
      if (props.fullWidth) return undefined

      return {
        width: convertToUnit(props.width)
      }
    })

    const hasTitle = computed(() => Boolean(slots.title))
    const hasActions = computed(() => Boolean(slots.actions))

    const classes = computed(() => ({
      'v-picker--landscape': props.landscape,
      'v-picker--full-width': props.fullWidth,
      ...themeClasses.value
    }))

    function genTitle () {
      return h('div', setBackgroundColor(computedTitleColor.value, {
        staticClass: 'v-picker__title',
        class: {
          'v-picker__title--landscape': props.landscape
        }
      }), slots.title?.())
    }

    function genBodyTransition () {
      return h('transition', { name: props.transition }, slots.default?.())
    }

    function genBody () {
      return h('div', {
        staticClass: 'v-picker__body',
        class: themeClasses.value,
        style: bodyStyles.value
      }, [genBodyTransition()])
    }

    function genActions () {
      return h('div', {
        staticClass: 'v-picker__actions v-card__actions'
      }, slots.actions?.())
    }

    return () => h('div', {
      staticClass: 'v-picker v-card',
      class: classes.value
    }, [
      hasTitle.value ? genTitle() : null,
      genBody(),
      hasActions.value ? genActions() : null
    ])
  }
})
