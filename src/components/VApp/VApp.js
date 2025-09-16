import '@/css/vuetify.css'

// Composables
import useThemeable from '../../composables/useThemeable'
import useAppTheme from './composables/useAppTheme'

// Directives
import Resize from '../../directives/resize'

// Types
import { defineComponent, h, computed, getCurrentInstance, watch, onMounted } from 'vue'

export default defineComponent({
  name: 'v-app',

  directives: { Resize },

  props: {
    id: {
      type: String,
      default: 'app'
    },
    dark: Boolean,
    light: Boolean
  },

  setup (props, { slots }) {
    const vm = getCurrentInstance()
    const proxy = vm?.proxy

    useAppTheme()

    const { themeClasses } = useThemeable(props)

    const classes = computed(() => ({
      'application--is-rtl': proxy?.$vuetify.rtl,
      ...themeClasses.value
    }))

    watch(() => props.dark, val => { if (proxy) proxy.$vuetify.dark = val })
    onMounted(() => { if (proxy) proxy.$vuetify.dark = props.dark })

    return () => {
      const wrapper = h('div', { class: 'application--wrap' }, slots.default?.())
      return h('div', {
        class: ['application', classes.value],
        attrs: { 'data-app': true },
        id: props.id
      }, [wrapper])
    }
  }
})
