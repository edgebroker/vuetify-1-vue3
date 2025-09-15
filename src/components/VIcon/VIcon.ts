import "@/css/vuetify.css"

// Composables
import useColorable, { colorProps } from '../../composables/useColorable'
import useSizeable, { sizeableProps } from '../../composables/useSizeable'
import useThemeable, { themeProps } from '../../composables/useThemeable'

// Utils
import { convertToUnit, keys, remapInternalIcon } from '../../util/helpers'

// Types
import { defineComponent, getCurrentInstance, h } from 'vue'
import { VuetifyIcon, VuetifyIconComponent } from 'vuetify'

enum SIZE_MAP {
  small = '16px',
  default = '24px',
  medium = '28px',
  large = '36px',
  xLarge = '40px'
}

function isFontAwesome5 (iconType: string): boolean {
  return ['fas', 'far', 'fal', 'fab'].some(val => iconType.includes(val))
}

export default defineComponent({
  name: 'v-icon',

  props: {
    disabled: Boolean,
    left: Boolean,
    right: Boolean,
    ...sizeableProps,
    ...colorProps,
    ...themeProps
  },

  setup (props, { slots, attrs }) {
    const instance = getCurrentInstance()
    const { setTextColor } = useColorable(props)
    const sizeRefs = useSizeable(props)
    const { themeClasses } = useThemeable(props)

    function getIcon (): VuetifyIcon {
      let iconName = ''
      const slot = slots.default?.()
      if (slot && slot.length && typeof slot[0].children === 'string') {
        iconName = (slot[0].children as string).trim()
      }
      return remapInternalIcon(instance!.proxy as any, iconName)
    }

    function getSize (): string | undefined {
      const sizes: any = {
        small: sizeRefs.small?.value,
        medium: sizeRefs.medium?.value,
        large: sizeRefs.large?.value,
        xLarge: sizeRefs.xLarge?.value
      }
      const explicitSize = keys(sizes).find(key => sizes[key])
      return (explicitSize && SIZE_MAP[explicitSize]) || convertToUnit(sizeRefs.size?.value)
    }

    function getDefaultData () {
      return {
        class: {
          'v-icon': true,
          'v-icon--disabled': props.disabled,
          'v-icon--left': props.left,
          'v-icon--link': !!attrs.onClick,
          'v-icon--right': props.right
        },
        'aria-hidden': true,
        ...attrs
      } as any
    }

    function applyColors (data: any) {
      data.class = { ...data.class, ...themeClasses.value }
      setTextColor(props.color, data)
    }

    function renderFontIcon (icon: string) {
      const children: any[] = []
      const data: any = getDefaultData()

      let iconType = 'material-icons'
      const delimiterIndex = icon.indexOf('-')
      const isMaterialIcon = delimiterIndex <= -1

      if (isMaterialIcon) {
        children.push(icon)
      } else {
        iconType = icon.slice(0, delimiterIndex)
        if (isFontAwesome5(iconType)) iconType = ''
      }

      data.class[iconType] = true
      data.class[icon] = !isMaterialIcon

      const fontSize = getSize()
      if (fontSize) data.style = { fontSize }

      applyColors(data)

      return h('i', data, children)
    }

    function renderSvgIcon (icon: VuetifyIconComponent) {
      const data: any = getDefaultData()
      data.class['v-icon--is-component'] = true

      const size = getSize()
      if (size) {
        data.style = { fontSize: size, height: size }
      }

      applyColors(data)

      return h(icon.component as any, { ...data, ...icon.props })
    }

    return () => {
      const icon = getIcon()
      if (typeof icon === 'string') return renderFontIcon(icon)
      return renderSvgIcon(icon)
    }
  }
})
