// Styles
import '@/css/vuetify.css'

// Composables
import useApplicationable from '../../composables/useApplicationable'
import useColorable, { colorProps } from '../../composables/useColorable'
import useThemeable, { themeProps } from '../../composables/useThemeable'

// Types
import { defineComponent, h, computed, getCurrentInstance } from 'vue'

export default defineComponent({
  name: 'v-footer',

  props: {
    height: {
      default: 32,
      type: [Number, String],
    },
    inset: Boolean,
    app: Boolean,
    absolute: Boolean,
    fixed: Boolean,
    ...colorProps,
    ...themeProps,
  },

  setup (props, { slots }) {
    const { setBackgroundColor } = useColorable(props)
    const { themeClasses } = useThemeable(props)
    const { app } = useApplicationable(props, computed(() => props.inset ? 'insetFooter' : 'footer'), ['height', 'inset'])
    const vm = getCurrentInstance()

    const computedMarginBottom = computed(() => {
      if (!app.value) return 0
      return vm?.proxy.$vuetify.application.bottom
    })

    const computedPaddingLeft = computed(() => {
      return !app.value || !props.inset
        ? 0
        : vm?.proxy.$vuetify.application.left
    })

    const computedPaddingRight = computed(() => {
      return !app.value || !props.inset
        ? 0
        : vm?.proxy.$vuetify.application.right
    })

    const styles = computed(() => {
      const style = {
        height: isNaN(props.height) ? props.height : `${props.height}px`,
      }
      if (computedPaddingLeft.value) style.paddingLeft = `${computedPaddingLeft.value}px`
      if (computedPaddingRight.value) style.paddingRight = `${computedPaddingRight.value}px`
      if (computedMarginBottom.value) style.marginBottom = `${computedMarginBottom.value}px`
      return style
    })

    const classes = computed(() => ({
      'v-footer--absolute': props.absolute,
      'v-footer--fixed': !props.absolute && (props.app || props.fixed),
      'v-footer--inset': props.inset,
      ...themeClasses.value,
    }))

    return () => h('footer', setBackgroundColor(props.color, {
      class: ['v-footer', classes.value],
      style: styles.value,
      ref: 'content',
    }), slots.default?.())
  }
})

