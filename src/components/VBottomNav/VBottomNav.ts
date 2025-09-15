// Styles
import '@/css/vuetify.css'

// Composables
import useApplicationable from '../../composables/useApplicationable'
import useButtonGroup from '../../composables/useButtonGroup'
import useColorable, { colorProps } from '../../composables/useColorable'
import useThemeable, { themeProps } from '../../composables/useThemeable'

// Types
import { defineComponent, h, computed } from 'vue'

export default defineComponent({
  name: 'v-bottom-nav',

  props: {
    active: [Number, String],
    mandatory: Boolean,
    height: {
      default: 56,
      type: [Number, String]
    },
    shift: Boolean,
    value: null,
    app: Boolean,
    absolute: Boolean,
    fixed: Boolean,
    ...colorProps,
    ...themeProps
  },

  setup (props, { slots, emit }) {
    const { setBackgroundColor } = useColorable(props)
    const { themeClasses } = useThemeable(props)
    useButtonGroup(props)

    const computedHeight = computed(() => parseInt(props.height as any))
    const { setUpdateApplication } = useApplicationable(props, 'bottom', ['height', 'value'])
    setUpdateApplication(() => props.value ? computedHeight.value : 0)

    const classes = computed(() => ({
      'v-bottom-nav--absolute': props.absolute,
      'v-bottom-nav--fixed': !props.absolute && (props.app || props.fixed),
      'v-bottom-nav--shift': props.shift,
      'v-bottom-nav--active': props.value,
      ...themeClasses.value
    }))

    function updateValue (val: any) {
      emit('update:active', val)
    }

    return () => h('div', setBackgroundColor(props.color, {
      class: ['v-bottom-nav', classes.value],
      style: { height: `${computedHeight.value}px` },
      onClick: (e: any) => updateValue(e)
    }), slots.default?.())
  }
})

