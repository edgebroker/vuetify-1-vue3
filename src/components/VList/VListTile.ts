import { defineComponent, h, computed } from 'vue'

import useColorable, { colorProps } from '../../composables/useColorable'
import useRoutable, { routableProps } from '../../composables/useRoutable'
import useToggleable from '../../composables/useToggleable'
import useThemeable, { themeProps } from '../../composables/useThemeable'

export default defineComponent({
  name: 'v-list-tile',

  inheritAttrs: false,

  props: {
    activeClass: {
      type: String,
      default: 'primary--text'
    },
    avatar: Boolean,
    inactive: Boolean,
    tag: String,
    value: {
      type: Boolean,
      default: false
    },
    ...routableProps,
    ...colorProps,
    ...themeProps
  },

  setup (props, { slots, attrs, emit }) {
    const { setTextColor } = useColorable(props)
    const { generateRouteLink } = useRoutable(props, { attrs, emit })
    const { isActive } = useToggleable(props, emit)
    const { themeClasses } = useThemeable(props)

    const listClasses = computed(() => props.disabled
      ? { 'v-list--disabled': true }
      : undefined)

    const isLink = computed(() => {
      const hasClick = attrs.on && ((attrs.on as any).click || (attrs.on as any)['!click'])
      return Boolean(
        props.href ||
        props.to ||
        hasClick
      )
    })

    const classes = computed(() => ({
      'v-list__tile': true,
      'v-list__tile--link': isLink.value && !props.inactive,
      'v-list__tile--avatar': props.avatar,
      'v-list__tile--disabled': props.disabled,
      'v-list__tile--active': !props.to && isActive.value,
      ...themeClasses.value,
      [props.activeClass]: isActive.value
    }))

    return () => {
      const isRouteLink = !props.inactive && isLink.value
      const { tag, data } = isRouteLink ? generateRouteLink(classes.value) : {
        tag: props.tag || 'div',
        data: { class: classes.value }
      }

      data.attrs = Object.assign({}, data.attrs, attrs)

      return h('div', setTextColor(!props.disabled && isActive.value && props.color, {
        class: listClasses.value,
        attrs: {
          disabled: props.disabled,
          role: 'listitem'
        }
      }), [h(tag, data, slots.default?.())])
    }
  }
})

