// Styles
import '@/css/vuetify.css'

// Composables
import useApplicationable from '../../composables/useApplicationable'
import useColorable, { colorProps } from '../../composables/useColorable'
import useThemeable, { themeProps } from '../../composables/useThemeable'

// Types
import { defineComponent, h, computed, getCurrentInstance, ref } from 'vue'
import { PropType } from 'vue'

export default defineComponent({
  name: 'v-footer',

  props: {
    height: {
      default: 32,
      type: [Number, String] as PropType<number | string>,
    },
    inset: Boolean,
    app: Boolean,
    absolute: Boolean,
    fixed: Boolean,
    ...colorProps,
    ...themeProps,
  },

  setup (props, { slots }) {
    const footerRef = ref<HTMLElement | null>(null)
    const { setBackgroundColor } = useColorable(props)
    const { themeClasses } = useThemeable(props)
    const applicationKey = computed(() => (props.inset ? 'insetFooter' : 'footer'))
    const { app } = useApplicationable(props, applicationKey, ['height', 'inset'])
    const vm = getCurrentInstance()
    const proxy = vm?.proxy as any

    const application = computed(() => proxy?.$vuetify?.application)

    const computedHeight = computed(() => {
      const parsed = Number(props.height)
      return Number.isNaN(parsed) ? String(props.height) : `${parsed}px`
    })

    const computedMarginBottom = computed(() => {
      if (!app.value || !application.value) return 0
      return application.value.bottom
    })

    const computedPaddingLeft = computed(() => {
      if (!app.value || !props.inset || !application.value) return 0
      return application.value.left
    })

    const computedPaddingRight = computed(() => {
      if (!app.value || !props.inset || !application.value) return 0
      return application.value.right
    })

    const styles = computed(() => {
      const style: Record<string, string> = {
        height: computedHeight.value,
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
      ref: footerRef,
    }), slots.default?.())
  }
})

