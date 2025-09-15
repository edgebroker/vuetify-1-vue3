// Styles
import '@/css/vuetify.css'

// Components
import VProgressCircular from '../VProgressCircular'

// Composables
import useColorable, { colorProps } from '../../composables/useColorable'
import useRoutable, { routableProps } from '../../composables/useRoutable'
import usePositionable, { positionProps } from '../../composables/usePositionable'
import useThemeable, { themeProps } from '../../composables/useThemeable'
import { factory as groupableFactory } from '../../composables/useGroupable'
import { factory as toggleableFactory } from '../../composables/useToggleable'

// Types
import { defineComponent, h, computed } from 'vue'

const useBtnGroup = groupableFactory('btnToggle')
const useToggle = toggleableFactory('inputValue')

export default defineComponent({
  name: 'v-btn',

  props: {
    activeClass: {
      type: String,
      default: 'v-btn--active'
    },
    block: Boolean,
    depressed: Boolean,
    fab: Boolean,
    flat: Boolean,
    icon: Boolean,
    large: Boolean,
    loading: Boolean,
    outline: Boolean,
    ripple: {
      type: [Boolean, Object],
      default: null
    },
    round: Boolean,
    small: Boolean,
    tag: {
      type: String,
      default: 'button'
    },
    type: {
      type: String,
      default: 'button'
    },
    value: null,
    ...routableProps,
    ...positionProps,
    ...colorProps,
    ...themeProps
  },

  setup (props, { slots, attrs, emit }) {
    const { setBackgroundColor, setTextColor } = useColorable(props)
    const { generateRouteLink } = useRoutable(props, { attrs, emit })
    const { positionClasses } = usePositionable(props)
    const { themeClasses } = useThemeable(props)
    const { groupClasses, toggle } = useBtnGroup(props, emit)
    const { isActive } = useToggle(props, emit)

    const classes = computed(() => ({
      'v-btn': true,
      'v-btn--block': props.block,
      'v-btn--flat': props.flat,
      'v-btn--floating': props.fab,
      'v-btn--icon': props.icon,
      'v-btn--large': props.large,
      'v-btn--loading': props.loading,
      'v-btn--outline': props.outline,
      'v-btn--depressed': (props.depressed && !props.flat) || props.outline,
      'v-btn--round': props.round,
      'v-btn--small': props.small,
      ...positionClasses.value,
      ...themeClasses.value,
      ...groupClasses.value
    }))

    function genContent () {
      return h('div', { class: 'v-btn__content' }, slots.default?.())
    }

    function genLoader () {
      if (!props.loading) return null
      return h('span', { class: 'v-btn__loading' }, slots.loader?.() || [
        h(VProgressCircular, { indeterminate: true, size: 23, width: 2 })
      ])
    }

    function click (e: MouseEvent) {
      emit('click', e)
      toggle()
    }

    return () => {
      const setColor = (!props.outline && !props.flat && !attrs.disabled)
        ? setBackgroundColor
        : setTextColor
      const { tag, data } = generateRouteLink(classes.value)
      const children = [genContent(), genLoader()]

      if (tag === 'button') data.attrs!.type = props.type
      data.attrs!.value = ['string', 'number'].includes(typeof props.value)
        ? props.value
        : JSON.stringify(props.value)

      return h(tag, { ...setColor(props.color, data), on: { ...data.on, click } }, children)
    }
  }
})
