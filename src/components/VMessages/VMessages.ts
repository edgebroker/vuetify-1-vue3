import '@/css/vuetify.css'

import { defineComponent, h, PropType } from 'vue'

import useColorable, { colorProps } from '../../composables/useColorable'
import useThemeable, { themeProps } from '../../composables/useThemeable'

import { escapeHTML } from '../../util/helpers'

export default defineComponent({
  name: 'v-messages',

  props: {
    value: {
      type: Array as PropType<string[]>,
      default: () => ([])
    },
    ...colorProps,
    ...themeProps
  },

  setup (props, { slots }) {
    const { setTextColor } = useColorable(props)
    const { themeClasses } = useThemeable(props)

    function genMessage (message: string, key: number) {
      const slot = slots.default ? slots.default({ message, key }) : undefined
      const escapedHTML = escapeHTML(message)
      const innerHTML = slot ? undefined : escapedHTML

      return h('div', {
        class: 'v-messages__message',
        key,
        innerHTML
      }, slot)
    }

    function genChildren () {
      return h('transition-group', {
        class: 'v-messages__wrapper',
        name: 'message-transition',
        tag: 'div'
      }, props.value.map(genMessage))
    }

    return () => h('div', setTextColor(props.color, {
      class: ['v-messages', themeClasses.value]
    }), [genChildren()])
  }
})

