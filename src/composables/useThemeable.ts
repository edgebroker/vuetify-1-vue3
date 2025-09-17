import { inject, provide, reactive, computed, watch, getCurrentInstance } from 'vue'

export const themeProps = {
  dark: {
    type: Boolean,
    default: null
  },
  light: {
    type: Boolean,
    default: null
  }
}

export default function useThemeable (props) {
  const parentTheme = inject('theme', { isDark: false })
  const theme = reactive({ isDark: false })
  provide('theme', theme)

  const vm = getCurrentInstance()

  const isDark = computed(() => {
    if (props.dark === true) return true
    if (props.light === true) return false
    return parentTheme.isDark
  })

  const themeClasses = computed(() => ({
    'theme--dark': isDark.value,
    'theme--light': !isDark.value
  }))

  const rootIsDark = computed(() => {
    if (props.dark === true) return true
    if (props.light === true) return false
    return vm?.proxy.$vuetify.dark
  })

  const rootThemeClasses = computed(() => ({
    'theme--dark': rootIsDark.value,
    'theme--light': !rootIsDark.value
  }))

  watch(isDark, val => {
    theme.isDark = val
  }, { immediate: true })

  return { isDark, themeClasses, rootThemeClasses, theme }
}

export function functionalThemeClasses (context) {
  const props = context.props || {}
  const injections = context.injections || {}
  const theme = injections.theme || { isDark: false }

  const isDark = props.dark === true
    ? true
    : props.light === true
      ? false
      : theme.isDark

  return {
    'theme--dark': isDark,
    'theme--light': !isDark
  }
}

