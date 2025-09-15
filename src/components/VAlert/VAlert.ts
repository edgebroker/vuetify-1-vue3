// Styles
import '@/css/vuetify.css'

// Components
import VIcon from '../VIcon'

// Composables
import useColorable, { colorProps } from '../../composables/useColorable'
import useToggleable from '../../composables/useToggleable'
import useTransitionable, { transitionableProps } from '../../composables/useTransitionable'

// Types
import { defineComponent, h, withDirectives, vShow, computed } from 'vue'

export default defineComponent({
  name: 'v-alert',

  props: {
    dismissible: Boolean,
    icon: String,
    outline: Boolean,
    type: {
      type: String,
      validator (val: string) {
        return [
          'info',
          'error',
          'success',
          'warning'
        ].includes(val)
      }
    },
    ...colorProps,
    value: { type: Boolean, default: true },
    ...transitionableProps
  },

  setup (props, { slots, emit, attrs }) {
    const { setBackgroundColor, setTextColor } = useColorable(props)
    const { isActive } = useToggleable(props, emit)
    const { transition, origin, mode } = useTransitionable(props)

    const computedColor = computed(() => (props.type && !props.color) ? props.type : (props.color || 'error'))
    const computedIcon = computed(() => {
      if (props.icon || !props.type) return props.icon
      switch (props.type) {
        case 'info': return '$vuetify.icons.info'
        case 'error': return '$vuetify.icons.error'
        case 'success': return '$vuetify.icons.success'
        case 'warning': return '$vuetify.icons.warning'
      }
    })

    function genIcon () {
      if (!computedIcon.value) return null
      return h(VIcon, { class: 'v-alert__icon' }, { default: () => computedIcon.value })
    }

    function genDismissible () {
      if (!props.dismissible) return null
      return h('a', {
        class: 'v-alert__dismissible',
        onClick: () => { isActive.value = false }
      }, [
        h(VIcon, { right: true }, { default: () => '$vuetify.icons.cancel' })
      ])
    }

    return () => {
      const children = [
        genIcon(),
        h('div', slots.default?.()),
        genDismissible()
      ]
      const setColor = props.outline ? setTextColor : setBackgroundColor
      const alert = withDirectives(
        h('div', setColor(computedColor.value, {
          class: {
            'v-alert': true,
            'v-alert--outline': props.outline
          },
          ...attrs
        }), children),
        [[vShow, isActive.value]]
      )

      if (!props.transition) return alert

      return h('transition', {
        name: transition.value,
        origin: origin.value,
        mode: mode.value
      }, { default: () => [alert] })
    }
  }
})

