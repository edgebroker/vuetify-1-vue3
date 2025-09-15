import "@/css/vuetify.css"

// Directives
import Touch from '../../directives/touch'

// Components
import { VFabTransition } from '../transitions'
import VProgressCircular from '../VProgressCircular/VProgressCircular'

// Composables
import useSelectable, { selectableProps } from '../../composables/useSelectable'
import useRippleable, { rippleableProps } from '../../composables/useRippleable'
import useColorable from '../../composables/useColorable'
import useThemeable, { themeProps } from '../../composables/useThemeable'

// Helpers
import { keyCodes } from '../../util/helpers'

// Types
import { defineComponent, h, computed } from 'vue'

export default defineComponent({
  name: 'v-switch',

  directives: { Touch },

  props: {
    loading: {
      type: [Boolean, String],
      default: false,
    },
    ...selectableProps,
    ...rippleableProps,
    ...themeProps,
  },

  emits: ['change', 'click'],

  setup (props, { attrs, slots, emit }) {
    const { genInput, genLabel, isActive, computedColor, onChange } = useSelectable(props, { emit })
    const { genRipple } = useRippleable(props, { onChange })
    const { setTextColor } = useColorable(props)
    const { themeClasses } = useThemeable(props)

    const classes = computed(() => ({
      'v-input--selection-controls': true,
      'v-input--switch': true,
    }))

    const switchData = computed(() => setTextColor(props.loading ? undefined : computedColor.value, {
      class: themeClasses.value,
    }))

    function onSwipeLeft () {
      if (isActive.value) onChange()
    }

    function onSwipeRight () {
      if (!isActive.value) onChange()
    }

    function onKeydown (e) {
      if (
        (e.keyCode === keyCodes.left && isActive.value) ||
        (e.keyCode === keyCodes.right && !isActive.value)
      ) onChange()
    }

    function genProgress () {
      if (props.loading === false) {
        return h(VFabTransition, {}, { default: () => [null] })
      }

      const progressColor = (props.loading === true || props.loading === '')
        ? (props.color || 'primary')
        : props.loading

      const slotContent = slots.progress?.()
      const nodes = slotContent && slotContent.length
        ? slotContent
        : [h(VProgressCircular, {
          props: {
            color: progressColor,
            size: 16,
            width: 2,
            indeterminate: true,
          },
        })]

      return h(VFabTransition, {}, { default: () => nodes })
    }

    function genSwitch () {
      return h('div', {
        staticClass: 'v-input--selection-controls__input',
      }, [
        genInput('checkbox', attrs),
        genRipple(setTextColor(computedColor.value, {
          directives: [[Touch, {
            left: onSwipeLeft,
            right: onSwipeRight,
          }]],
        })),
        h('div', {
          staticClass: 'v-input--switch__track',
          ...switchData.value,
        }),
        h('div', {
          staticClass: 'v-input--switch__thumb',
          ...switchData.value,
        }, [genProgress()]),
      ])
    }

    return () => h('div', {
      class: classes.value,
      on: { keydown: onKeydown },
    }, [
      genSwitch(),
      genLabel(),
    ])
  },
})
