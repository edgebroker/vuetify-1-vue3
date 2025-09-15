// Components
import VIcon from '../VIcon'

// Composables
import useColorable from '../../composables/useColorable'
import useThemeable, { themeProps } from '../../composables/useThemeable'

// Types
import { defineComponent, computed, h } from 'vue'

export default defineComponent({
  name: 'v-timeline-item',

  props: {
    color: {
      type: String,
      default: 'primary',
    },
    fillDot: Boolean,
    hideDot: Boolean,
    icon: String,
    iconColor: String,
    large: Boolean,
    left: Boolean,
    right: Boolean,
    small: Boolean,
    ...themeProps,
  },

  setup (props, { slots }) {
    const { setBackgroundColor } = useColorable(props)
    const { themeClasses, isDark } = useThemeable(props)

    const hasIcon = computed(() => !!props.icon || !!slots.icon)

    function genBody () {
      return h('div', { class: 'v-timeline-item__body' }, slots.default?.())
    }

    function genIcon () {
      const slotIcon = slots.icon?.()
      if (slotIcon) {
        return slotIcon
      }

      return h(VIcon, {
        color: props.iconColor,
        dark: !isDark.value,
        small: props.small,
      }, () => props.icon)
    }

    function genInnerDot () {
      const data = setBackgroundColor(props.color, {})

      return h('div', {
        class: ['v-timeline-item__inner-dot', data.class],
        style: data.style,
      }, hasIcon.value ? genIcon() : undefined)
    }

    function genDot () {
      return h('div', {
        class: {
          'v-timeline-item__dot': true,
          'v-timeline-item__dot--small': props.small,
          'v-timeline-item__dot--large': props.large,
        },
      }, [genInnerDot()])
    }

    function genOpposite () {
      return h('div', {
        class: 'v-timeline-item__opposite',
      }, slots.opposite?.())
    }

    return () => {
      const children = [genBody()]

      if (!props.hideDot) children.unshift(genDot())
      if (slots.opposite) children.push(genOpposite())

      return h('div', {
        class: {
          'v-timeline-item': true,
          'v-timeline-item--fill-dot': props.fillDot,
          'v-timeline-item--left': props.left,
          'v-timeline-item--right': props.right,
          ...themeClasses.value,
        },
      }, children)
    }
  }
})
