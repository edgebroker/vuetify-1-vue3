import "@/css/vuetify.css"

import VIcon from '../VIcon'

// Directives
import Resize from '../../directives/resize'

// Composables
import useColorable, { colorProps } from '../../composables/useColorable'
import useThemeable, { themeProps } from '../../composables/useThemeable'

// Helpers

// Types
import { defineComponent, h, ref, computed, watch, nextTick, onMounted, getCurrentInstance } from 'vue'

export default defineComponent({
  name: 'v-pagination',

  directives: { Resize },

  props: {
    circle: Boolean,
    disabled: Boolean,
    length: {
      type: Number,
      default: 0,
      validator: (val: number) => val % 1 === 0
    },
    totalVisible: [Number, String],
    nextIcon: {
      type: String,
      default: '$vuetify.icons.next'
    },
    prevIcon: {
      type: String,
      default: '$vuetify.icons.prev'
    },
    value: {
      type: Number,
      default: 0
    },
    ...colorProps,
    ...themeProps
  },

  setup (props, { emit }) {
    const pagination = ref<HTMLElement | null>(null)
    const maxButtons = ref(0)
    const selected = ref<number | null>(null)

    const vm = getCurrentInstance()
    const { setBackgroundColor } = useColorable(props)
    const { themeClasses } = useThemeable(props)

    const classes = computed(() => ({
      'v-pagination': true,
      'v-pagination--circle': props.circle,
      'v-pagination--disabled': props.disabled,
      ...themeClasses.value
    }))

    const items = computed<(string | number)[]>(() => {
      const maxLength = parseInt(props.totalVisible as any, 10) || maxButtons.value
      if (props.length <= maxLength) {
        return range(1, props.length)
      }

      const even = maxLength % 2 === 0 ? 1 : 0
      const left = Math.floor(maxLength / 2)
      const right = props.length - left + 1 + even

      if (props.value > left && props.value < right) {
        const start = props.value - left + 2
        const end = props.value + left - 2 - even

        return [1, '...', ...range(start, end), '...', props.length]
      } else if (props.value === left) {
        const end = props.value + left - 1 - even
        return [...range(1, end), '...', props.length]
      } else if (props.value === right) {
        const start = props.value - left + 1
        return [1, '...', ...range(start, props.length)]
      }

      return [
        ...range(1, left),
        '...',
        ...range(right, props.length)
      ]
    })

    const isRtl = computed(() => vm?.proxy.$vuetify.rtl)

    function init () {
      selected.value = null
      nextTick(onResize)
      setTimeout(() => { selected.value = props.value }, 100)
    }

    function onResize () {
      const parentWidth = pagination.value?.parentElement
        ? pagination.value.parentElement.clientWidth
        : window.innerWidth

      maxButtons.value = Math.floor((parentWidth - 96) / 42)
    }

    function next (e: Event) {
      e.preventDefault()
      emit('input', props.value + 1)
      emit('next')
    }

    function previous (e: Event) {
      e.preventDefault()
      emit('input', props.value - 1)
      emit('previous')
    }

    function range (from: number, to: number) {
      const list: number[] = []
      let start = from > 0 ? from : 1

      for (let i = start; i <= to; i++) {
        list.push(i)
      }

      return list
    }

    function genIcon (icon: string, disabled: boolean, fn: EventListener) {
      return h('li', [
        h('button', {
          staticClass: 'v-pagination__navigation',
          class: {
            'v-pagination__navigation--disabled': disabled
          },
          attrs: {
            type: 'button'
          },
          on: disabled ? {} : { click: fn }
        }, [h(VIcon, [icon])])
      ])
    }

    function genItem (item: string | number) {
      const color = item === props.value ? (props.color || 'primary') : false
      return h('button', setBackgroundColor(color, {
        staticClass: 'v-pagination__item',
        class: {
          'v-pagination__item--active': item === props.value
        },
        attrs: {
          type: 'button'
        },
        on: {
          click: () => emit('input', item)
        }
      }), [item.toString()])
    }

    function genItems () {
      return items.value.map((item, index) => h('li', { key: index }, [
        isNaN(Number(item))
          ? h('span', { class: 'v-pagination__more' }, [item.toString()])
          : genItem(item)
      ]))
    }

    watch(() => props.value, () => {
      init()
    })

    onMounted(() => {
      init()
    })

    return () => {
      const children = [
        genIcon(isRtl.value ? props.nextIcon : props.prevIcon, props.value <= 1, previous),
        ...genItems(),
        genIcon(isRtl.value ? props.prevIcon : props.nextIcon, props.value >= props.length, next)
      ]

      return h('ul', {
        directives: [{
          modifiers: { quiet: true },
          name: 'resize',
          value: onResize
        }],
        class: classes.value,
        ref: pagination
      }, children)
    }
  }
})
