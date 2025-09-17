import '@/css/vuetify.css'

import useColorable, { colorProps } from '../../composables/useColorable'
import useToggleable from '../../composables/useToggleable'
import usePositionable, { positionPropsFactory } from '../../composables/usePositionable'

import { defineComponent, h, computed, ref, watchEffect, onBeforeUnmount } from 'vue'

const VSnackbar = defineComponent({
  name: 'v-snackbar',

  props: {
    autoHeight: Boolean,
    multiLine: Boolean,
    timeout: {
      type: Number,
      default: 6000
    },
    vertical: Boolean,
    value: {
      type: Boolean,
      default: false
    },
    ...colorProps,
    ...positionPropsFactory(['absolute', 'top', 'bottom', 'left', 'right'])
  },

  setup (props, { slots, attrs, emit }) {
    const { setBackgroundColor } = useColorable(props)
    const { isActive } = useToggleable(props, emit)
    const { positionClasses } = usePositionable(props, ['absolute', 'top', 'bottom', 'left', 'right'])

    const activeTimeout = ref<number | undefined>()

    const clearActiveTimeout = () => {
      if (activeTimeout.value != null) {
        window.clearTimeout(activeTimeout.value)
        activeTimeout.value = undefined
      }
    }

    watchEffect(onInvalidate => {
      clearActiveTimeout()

      if (!isActive.value || !props.timeout) return

      activeTimeout.value = window.setTimeout(() => {
        isActive.value = false
      }, props.timeout)

      onInvalidate(clearActiveTimeout)
    })

    onBeforeUnmount(clearActiveTimeout)

    const classes = computed(() => ({
      'v-snack--active': isActive.value,
      'v-snack--absolute': positionClasses.value.absolute,
      'v-snack--auto-height': props.autoHeight,
      'v-snack--bottom': props.bottom || !props.top,
      'v-snack--left': props.left,
      'v-snack--multi-line': props.multiLine && !props.vertical,
      'v-snack--right': props.right,
      'v-snack--top': props.top,
      'v-snack--vertical': props.vertical
    }))

    return () => {
      const { class: classAttr, style, ...restAttrs } = attrs as any

      const snackbar = h('div', {
        class: ['v-snack', classes.value, classAttr],
        style,
        ...restAttrs
      }, [
        h('div', setBackgroundColor(props.color, {
          class: 'v-snack__wrapper'
        }), [
          h('div', { class: 'v-snack__content' }, slots.default?.())
        ])
      ])

      return h('transition', { name: 'v-snack-transition' }, {
        default: () => (isActive.value ? [snackbar] : [])
      })
    }
  }
})

export { VSnackbar }
export default VSnackbar
