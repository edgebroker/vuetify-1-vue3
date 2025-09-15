// Styles
import "@/css/vuetify.css"

// Components
import VIcon from '../VIcon'

// Composables
import useColorable, { colorProps } from '../../composables/useColorable'
import useToggleable from '../../composables/useToggleable'
import useTransitionable, { transitionableProps } from '../../composables/useTransitionable'

// Utilities
import { defineComponent, computed, h, withDirectives, vShow, Transition } from 'vue'

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
    value: null,
    ...colorProps,
    ...transitionableProps
  },

  emits: ['input'],

  setup (props, { slots, emit }) {
    const { setBackgroundColor, setTextColor } = useColorable(props)
    const { isActive } = useToggleable(props, emit)
    const { mode, origin, transition } = useTransitionable(props)

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
      }, [h(VIcon, { right: true }, { default: () => '$vuetify.icons.cancel' })])
    }

    return {
      computedColor,
      genDismissible,
      genIcon,
      isActive,
      mode,
      origin,
      setBackgroundColor,
      setTextColor,
      transition,
      slots
    }
  },

  render () {
    const children = [
      this.genIcon(),
      h('div', this.$slots.default && this.$slots.default()),
      this.genDismissible()
    ]
    const setColor = this.outline ? this.setTextColor : this.setBackgroundColor
    const alert = withDirectives(h('div', setColor(this.computedColor, {
      class: {
        'v-alert': true,
        'v-alert--outline': this.outline
      },
      ...this.$attrs
    }), children), [[vShow, this.isActive]])

    if (!this.transition) return alert

    return h(Transition, {
      name: this.transition,
      mode: this.mode
    }, { default: () => [alert] })
  }
})

