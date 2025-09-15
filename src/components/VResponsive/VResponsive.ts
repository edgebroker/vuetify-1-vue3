// Styles
import '@/css/vuetify.css'

// Composables
import useMeasurable, { measurableProps } from '../../composables/useMeasurable'

// Types
import { computed, defineComponent, h, PropType } from 'vue'

export default defineComponent({
  name: 'v-responsive',

  props: {
    ...measurableProps,
    aspectRatio: [String, Number] as PropType<string | number>
  },

  setup (props, { slots, attrs }) {
    const { measurableStyles } = useMeasurable(props)

    const computedAspectRatio = computed(() => Number(props.aspectRatio))

    const aspectStyle = computed(() => {
      return computedAspectRatio.value
        ? { paddingBottom: (1 / computedAspectRatio.value) * 100 + '%' }
        : undefined
    })

    function genContent () {
      return h('div', { class: 'v-responsive__content' }, slots.default?.())
    }

    return () => {
      const sizer = aspectStyle.value
        ? h('div', { style: aspectStyle.value, class: 'v-responsive__sizer' })
        : null

      const { class: className, style, ...restAttrs } = attrs as any

      return h('div', {
        ...restAttrs,
        class: ['v-responsive', className],
        style: [measurableStyles.value, style]
      }, [
        sizer,
        genContent()
      ])
    }
  }
})

