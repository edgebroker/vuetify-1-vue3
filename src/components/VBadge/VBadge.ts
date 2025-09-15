// Styles
import '@/css/vuetify.css'

// Composables
import useColorable from '../../composables/useColorable'
import useToggleable from '../../composables/useToggleable'
import usePositionable, { positionPropsFactory } from '../../composables/usePositionable'
import useTransitionable, { transitionableProps } from '../../composables/useTransitionable'

// Types
import { defineComponent, h, withDirectives, vShow, computed } from 'vue'

export default defineComponent({
  name: 'v-badge',

  props: {
    color: {
      type: String,
      default: 'primary'
    },
    overlap: Boolean,
    transition: {
      type: String,
      default: 'fab-transition'
    },
    value: {
      default: true
    },
    ...positionPropsFactory(['left', 'bottom']),
    ...transitionableProps
  },

  setup (props, { slots, attrs, emit }) {
    const { setBackgroundColor } = useColorable(props)
    const { isActive } = useToggleable(props, emit)
    const { positionClasses } = usePositionable(props, ['left', 'bottom'])
    const { transition, origin, mode } = useTransitionable(props)

    const classes = computed(() => ({
      ...positionClasses.value,
      'v-badge--overlap': props.overlap
    }))

    return () => {
      const badge = slots.badge && [
        withDirectives(
          h('span', setBackgroundColor(props.color, {
            class: 'v-badge__badge',
            ...attrs
          }), slots.badge()),
          [[vShow, isActive.value]]
        )
      ]

      return h('span', {
        class: ['v-badge', classes.value]
      }, [
        slots.default?.(),
        h('transition', {
          name: transition.value,
          origin: origin.value,
          mode: mode.value
        }, badge)
      ])
    }
  }
})

