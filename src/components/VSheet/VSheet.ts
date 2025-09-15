// Styles
import "@/css/vuetify.css"

// Composables
import useColorable, { colorProps } from '../../composables/useColorable'
import useElevatable from '../../composables/useElevatable'
import useMeasurable, { measurableProps } from '../../composables/useMeasurable'
import useThemeable, { themeProps } from '../../composables/useThemeable'

// Types
import { defineComponent, computed, h } from 'vue'
import type { VNode } from 'vue'

/* @vue/component */
export default defineComponent({
  name: 'v-sheet',

  props: {
    tag: {
      type: String,
      default: 'div'
    },
    tile: Boolean,
    elevation: [Number, String],
    ...measurableProps,
    ...themeProps,
    ...colorProps
  },

  setup (props, { slots, attrs }) {
    const { setBackgroundColor } = useColorable(props)
    const { elevationClasses } = useElevatable(props)
    const { measurableStyles } = useMeasurable(props)
    const { themeClasses } = useThemeable(props)

    const classes = computed(() => ({
      'v-sheet': true,
      'v-sheet--tile': props.tile,
      ...themeClasses.value,
      ...elevationClasses.value
    }))

    return (): VNode => {
      const colorData = setBackgroundColor(props.color, {
        class: classes.value,
        style: measurableStyles.value
      })

      const { class: colorClass, style: colorStyle, ...rest } = colorData as any

      return h(props.tag, {
        ...rest,
        ...attrs,
        class: [colorClass, attrs.class],
        style: [colorStyle, attrs.style]
      }, slots.default?.())
    }
  }
})
