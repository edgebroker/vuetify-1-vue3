// Styles
import "@/css/vuetify.css"

// Vue
import { defineComponent, h, computed } from 'vue'

// Composables
import useRoutable, { routableProps } from '../../composables/useRoutable'
import useColorable, { colorProps, setBackgroundColor } from '../../composables/useColorable'
import useThemeable, { themeProps } from '../../composables/useThemeable'
import useElevatable from '../../composables/useElevatable'
import useMeasurable, { measurableProps } from '../../composables/useMeasurable'

export default defineComponent({
  name: 'v-card',

  props: {
    flat: Boolean,
    hover: Boolean,
    img: String,
    raised: Boolean,
    tag: {
      type: String,
      default: 'div'
    },
    tile: Boolean,
    elevation: [Number, String],
    ...colorProps,
    ...themeProps,
    ...measurableProps,
    ...routableProps
  },

  setup (props, { slots, attrs, emit }) {
    const { generateRouteLink } = useRoutable(props, { attrs, emit })
    const { setBackgroundColor } = useColorable(props)
    const { themeClasses } = useThemeable(props)
    const { elevationClasses } = useElevatable(props)
    const { measurableStyles } = useMeasurable(props)

    const classes = computed(() => ({
      'v-card': true,
      'v-card--flat': props.flat,
      'v-card--hover': props.hover,
      'v-sheet': true,
      'v-sheet--tile': props.tile,
      ...themeClasses.value,
      ...elevationClasses.value
    }))

    const styles = computed(() => {
      const style = { ...measurableStyles.value } as any
      if (props.img) {
        style.background = `url("${props.img}") center center / cover no-repeat`
      }
      return style
    })

    return () => {
      const { tag, data } = generateRouteLink(classes.value)
      data.style = styles.value
      return h(tag, setBackgroundColor(props.color, data), slots.default?.())
    }
  }
})
