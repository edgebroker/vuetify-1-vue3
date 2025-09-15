import '@/css/vuetify.css'

// Components
import VDialog from '../VDialog/VDialog'

// Composables
import useToggleable from '../../composables/useToggleable'

// Types
import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'v-bottom-sheet',

  props: {
    disabled: Boolean,
    fullWidth: Boolean,
    hideOverlay: Boolean,
    inset: Boolean,
    lazy: Boolean,
    maxWidth: {
      type: [String, Number],
      default: 'auto'
    },
    persistent: Boolean,
    value: null
  },

  setup (props, { slots, attrs, emit }) {
    const { isActive } = useToggleable(props, emit)

    return () => {
      const contentClass = [
        'v-bottom-sheet',
        props.inset ? 'v-bottom-sheet--inset' : ''
      ].join(' ')

      return h(VDialog, {
        ...attrs,
        ...props,
        contentClass,
        noClickAnimation: true,
        transition: 'bottom-sheet-transition',
        value: isActive.value
      }, {
        activator: slots.activator,
        default: slots.default
      })
    }
  }
})
