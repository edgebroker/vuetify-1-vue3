// Styles
import '@/css/vuetify.css'

// Composables
import useButtonGroup from '../../composables/useButtonGroup'

// Types
import { defineComponent, h, computed } from 'vue'

export default defineComponent({
  name: 'v-btn-toggle',

  props: {
    activeClass: {
      type: String,
      default: 'v-btn--active'
    }
  },

  setup (props, { slots }) {
    const { selectedItems } = useButtonGroup(props)

    const classes = computed(() => ({
      'v-btn-toggle': true,
      'v-btn-toggle--only-child': selectedItems.value.length === 1,
      'v-btn-toggle--selected': selectedItems.value.length > 0
    }))

    return () => h('div', { class: classes.value }, slots.default?.())
  }
})

