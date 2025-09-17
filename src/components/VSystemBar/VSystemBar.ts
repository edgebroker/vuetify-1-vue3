import "@/css/vuetify.css"

// Composables
import useApplicationable from '../../composables/useApplicationable'
import useColorable, { colorProps } from '../../composables/useColorable'
import useThemeable, { themeProps } from '../../composables/useThemeable'

// Types
import { defineComponent, h, computed } from 'vue'

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

    useApplicationable(
      props,
      computed(() => 'bar'),
      ['height', 'window'],
      { updateApplication: () => computedHeight.value },
    )

    const classes = computed(() => ({
      'v-system-bar--lights-out': props.lightsOut,
      'v-system-bar--absolute': props.absolute,
      'v-system-bar--fixed': !props.absolute && (props.app || props.fixed),
      'v-system-bar--status': props.status,
      'v-system-bar--window': props.window,
      ...themeClasses.value,
    }))

    const barStyles = computed(() => ({
      height: `${computedHeight.value}px`,
    }))

    return () => h('div', setBackgroundColor(props.color, {
      class: {
        'v-system-bar': true,
        ...classes.value,
      },
      style: barStyles.value,
    }), slots.default?.())
  },
})
