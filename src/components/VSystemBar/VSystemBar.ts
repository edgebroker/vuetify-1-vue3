import "@/css/vuetify.css"

// Composables
import useApplicationable from '../../composables/useApplicationable'
import useColorable, { colorProps } from '../../composables/useColorable'
import useThemeable, { themeProps } from '../../composables/useThemeable'

// Types
import { defineComponent, h, computed, getCurrentInstance, watch } from 'vue'

export default defineComponent({
  name: 'v-system-bar',

  props: {
    height: {
      type: [Number, String],
      validator: (v: any) => !isNaN(parseInt(v, 10)),
    },
    lightsOut: Boolean,
    status: Boolean,
    window: Boolean,
    app: Boolean,
    absolute: Boolean,
    fixed: Boolean,
    ...colorProps,
    ...themeProps,
  },

  setup (props, { slots }) {
    const { setBackgroundColor } = useColorable(props)
    const { themeClasses } = useThemeable(props)

    const computedHeight = computed(() => {
      if (props.height) {
        return parseInt(props.height as any, 10)
      }
      return props.window ? 32 : 24
    })

    const application = useApplicationable(props, computed(() => 'bar'), ['height', 'window'])
    const vm = getCurrentInstance()

    watch([application.app, application.applicationProperty, computedHeight], ([app]) => {
      if (!app || !vm?.proxy) return
      vm.proxy.$vuetify?.application.bind(
        vm.uid,
        application.applicationProperty.value,
        computedHeight.value,
      )
    }, { immediate: true })

    const classes = computed(() => ({
      'v-system-bar--lights-out': props.lightsOut,
      'v-system-bar--absolute': props.absolute,
      'v-system-bar--fixed': !props.absolute && (props.app || props.fixed),
      'v-system-bar--status': props.status,
      'v-system-bar--window': props.window,
      ...themeClasses.value,
    }))

    return () => h('div', setBackgroundColor(props.color, {
      staticClass: 'v-system-bar',
      class: classes.value,
      style: {
        height: `${computedHeight.value}px`,
      },
    }), slots.default?.())
  },
})
