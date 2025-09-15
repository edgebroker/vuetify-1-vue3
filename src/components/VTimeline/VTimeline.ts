// Styles
import "@/css/vuetify.css"

// Composables
import useThemeable, { themeProps } from '../../composables/useThemeable'

// Types
import { defineComponent, computed, h } from 'vue'

export default defineComponent({
  name: 'v-timeline',

  props: {
    ...themeProps,
    alignTop: Boolean,
    dense: Boolean,
  },

  setup (props, { slots }) {
    const { themeClasses } = useThemeable(props)

    const classes = computed(() => ({
      'v-timeline--align-top': props.alignTop,
      'v-timeline--dense': props.dense,
      ...themeClasses.value,
    }))

    return () => h('div', {
      class: ['v-timeline', classes.value],
    }, slots.default?.())
  }
})
