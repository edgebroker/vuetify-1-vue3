// Styles
import "@/css/vuetify.css"

// Components
import VIcon from '../VIcon'

// Directives
import Ripple from '../../directives/ripple'

// Composables
import useColorable from '../../composables/useColorable'
import useDelayable from '../../composables/useDelayable'
import useThemeable, { themeProps } from '../../composables/useThemeable'
import { rippleableProps } from '../../composables/useRippleable'
import { sizeableProps } from '../../composables/useSizeable'

// Utilities
import { createRange } from '../../util/helpers'

// Types
import { defineComponent, computed, h, onBeforeUnmount, ref, watch, withDirectives } from 'vue'
import type { VNode, VNodeChildren } from 'vue'

type ItemSlotProps = {
  index: number
  value: number
  isFilled: boolean
  isHalfFilled?: boolean | undefined
  isHovered: boolean
  isHalfHovered?: boolean | undefined
  click: Function
}

/* @vue/component */
export default defineComponent({
  name: 'v-rating',

  props: {
    backgroundColor: {
      type: String,
      default: 'accent'
    },
    color: {
      type: String,
      default: 'primary'
    },
    dense: Boolean,
    emptyIcon: {
      type: String,
      default: '$vuetify.icons.ratingEmpty'
    },
    fullIcon: {
      type: String,
      default: '$vuetify.icons.ratingFull'
    },
    halfIcon: {
      type: String,
      default: '$vuetify.icons.ratingHalf'
    },
    halfIncrements: Boolean,
    length: {
      type: [Number, String],
      default: 5
    },
    clearable: Boolean,
    readonly: Boolean,
    hover: Boolean,
    value: {
      type: Number,
      default: 0
    },
    openDelay: {
      type: [Number, String],
      default: 0
    },
    closeDelay: {
      type: [Number, String],
      default: 0
    },
    ...rippleableProps,
    ...sizeableProps,
    ...themeProps
  },

  setup (props, { slots, emit }) {
    const { setTextColor } = useColorable(props)
    const { themeClasses } = useThemeable(props)
    const { clearDelay, runDelay } = useDelayable(props)

    const hoverIndex = ref(-1)
    const internalValue = ref(props.value)

    watch(() => props.value, val => {
      internalValue.value = val
    })

    watch(internalValue, val => {
      if (val !== props.value) emit('input', val)
    })

    const iconProps = computed(() => ({
      dark: props.dark,
      medium: props.medium,
      large: props.large,
      light: props.light,
      size: props.size,
      small: props.small,
      xLarge: props.xLarge
    }))

    const isHovering = computed(() => props.hover && hoverIndex.value >= 0)

    function isHalfEvent (e: MouseEvent): boolean {
      if (props.halfIncrements) {
        const target = e.target as HTMLElement | null
        const rect = target && target.getBoundingClientRect()
        if (rect && (e.pageX - rect.left) < rect.width / 2) return true
      }

      return false
    }

    function genHoverIndex (e: MouseEvent, i: number) {
      return i + (isHalfEvent(e) ? 0.5 : 1)
    }

    function createClickFn (i: number): Function {
      return (e: MouseEvent) => {
        if (props.readonly) return

        const newValue = genHoverIndex(e, i)
        if (props.clearable && internalValue.value === newValue) {
          internalValue.value = 0
        } else {
          internalValue.value = newValue
        }
      }
    }

    function createProps (i: number): ItemSlotProps {
      const itemProps: ItemSlotProps = {
        index: i,
        value: internalValue.value,
        click: createClickFn(i),
        isFilled: Math.floor(internalValue.value) > i,
        isHovered: Math.floor(hoverIndex.value) > i
      }

      if (props.halfIncrements) {
        itemProps.isHalfHovered = !itemProps.isHovered && (hoverIndex.value - i) % 1 > 0
        itemProps.isHalfFilled = !itemProps.isFilled && (internalValue.value - i) % 1 > 0
      }

      return itemProps
    }

    function getIconName (itemProps: ItemSlotProps): string {
      const isFull = isHovering.value ? itemProps.isHovered : itemProps.isFilled
      const isHalf = isHovering.value ? itemProps.isHalfHovered : itemProps.isHalfFilled

      return isFull ? props.fullIcon : isHalf ? props.halfIcon : props.emptyIcon
    }

    function getColor (itemProps: ItemSlotProps): string {
      if (isHovering.value) {
        if (itemProps.isHovered || itemProps.isHalfHovered) return props.color
      } else {
        if (itemProps.isFilled || itemProps.isHalfFilled) return props.color
      }

      return props.backgroundColor
    }

    function onMouseEnter (e: MouseEvent, i: number): void {
      runDelay('open', () => {
        hoverIndex.value = genHoverIndex(e, i)
      })
    }

    function onMouseLeave (): void {
      runDelay('close', () => (hoverIndex.value = -1))
    }

    function genItem (i: number): VNode | VNodeChildren | string {
      const itemProps = createProps(i)

      if (slots.item) return slots.item(itemProps)

      const listeners: Record<string, Function> = {
        click: itemProps.click
      }

      if (props.hover) {
        listeners.mouseenter = (e: MouseEvent) => onMouseEnter(e, i)
        listeners.mouseleave = onMouseLeave

        if (props.halfIncrements) {
          listeners.mousemove = (e: MouseEvent) => onMouseEnter(e, i)
        }
      }

      const data = setTextColor(getColor(itemProps), {
        props: iconProps.value,
        on: listeners
      }) as any

      let iconNode = h(VIcon as any, data, { default: () => [getIconName(itemProps)] })

      if (!props.readonly && props.ripple) {
        iconNode = withDirectives(iconNode, [[Ripple, { circle: true }]])
      }

      return iconNode
    }

    onBeforeUnmount(() => {
      clearDelay()
    })

    return () => {
      const children = createRange(Number(props.length)).map(i => genItem(i))

      return h('div', {
        staticClass: 'v-rating',
        class: {
          ...themeClasses.value,
          'v-rating--readonly': props.readonly,
          'v-rating--dense': props.dense
        }
      }, children as any)
    }
  }
})
