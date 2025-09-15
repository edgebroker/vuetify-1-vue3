import { defineComponent, h, computed } from 'vue'

// Composables
import useRoutable, { routableProps } from '../../composables/useRoutable'

export default defineComponent({
  name: 'v-breadcrumbs-item',

  props: {
    ...routableProps,
    // In a breadcrumb, the currently
    // active item should be dimmed
    activeClass: {
      type: String,
      default: 'v-breadcrumbs__item--disabled'
    }
  },

  setup (props, { attrs, slots, emit }) {
    const { generateRouteLink } = useRoutable(props, { attrs, emit })

    const classes = computed(() => ({
      'v-breadcrumbs__item': true,
      [props.activeClass]: props.disabled
    }))

    return () => {
      const { tag, data } = generateRouteLink(classes.value)
      return h('li', [h(tag, data, slots.default?.())])
    }
  }
})
