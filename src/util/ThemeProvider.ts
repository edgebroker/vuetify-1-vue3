import { Comment, Text, computed, defineComponent, watch } from 'vue'
import type { VNode } from 'vue'
import useThemeable, { themeProps } from '../composables/useThemeable'

function isWhitespaceText (node: VNode): boolean {
  return node.type === Text && typeof node.children === 'string' && node.children.trim().length === 0
}

export default defineComponent({
  name: 'theme-provider',

  props: {
    ...themeProps,
    root: Boolean
  },

  setup (props, { slots }) {
    const { isDark, rootIsDark, theme } = useThemeable(props)

    const computedIsDark = computed(() => props.root ? rootIsDark.value : isDark.value)

    watch(computedIsDark, val => {
      theme.isDark = val
    }, { immediate: true })

    return () => {
      const children = slots.default?.()
      if (!children) return null

      return children.find((node: VNode) => {
        if (node.type === Comment) return false
        if (isWhitespaceText(node)) return false
        return true
      }) || null
    }
  }
})
