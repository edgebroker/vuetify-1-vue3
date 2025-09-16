import { computed, ref, watch, getCurrentInstance } from 'vue'
import * as Theme from '../../../util/theme'

export default function useAppTheme () {
  const vm = getCurrentInstance()
  const proxy = vm?.proxy
  const style = ref(null)

  const parsedTheme = computed(() => {
    const theme = proxy?.$vuetify?.theme

    if (!theme || theme === false) return {}

    return Theme.parse(theme)
  })

  const generatedStyles = computed(() => {
    if (!proxy?.$vuetify || proxy.$vuetify.theme === false) return ''

    const theme = parsedTheme.value
    const options = proxy.$vuetify.options || {}
    let css

    if (options.themeCache != null) {
      css = options.themeCache.get(theme)
      if (css != null) return css
    }

    css = Theme.genStyles(theme, options.customProperties)

    if (options.minifyTheme != null) {
      css = options.minifyTheme(css)
    }

    if (options.themeCache != null) {
      options.themeCache.set(theme, css)
    }

    return css
  })

  const vueMeta = computed(() => {
    if (!proxy?.$vuetify || proxy.$vuetify.theme === false) return {}

    const options = {
      cssText: generatedStyles.value,
      id: 'vuetify-theme-stylesheet',
      type: 'text/css'
    }

    const nonce = proxy.$vuetify.options?.cspNonce
    if (nonce) options.nonce = nonce

    return { style: [options] }
  })

  function applyTheme () {
    if (style.value) {
      style.value.innerHTML = generatedStyles.value
    }
  }

  function genStyle () {
    if (typeof document === 'undefined') return

    let styleElement = document.getElementById('vuetify-theme-stylesheet')

    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.type = 'text/css'
      styleElement.id = 'vuetify-theme-stylesheet'

      const nonce = proxy?.$vuetify.options?.cspNonce
      if (nonce) {
        styleElement.setAttribute('nonce', nonce)
      }

      document.head.appendChild(styleElement)
    }

    style.value = styleElement
  }

  function initTheme () {
    if (!proxy?.$vuetify || proxy.$vuetify.theme === false) return

    if (proxy.$meta) {
      // Vue-meta handles injection via metaInfo()/head()
    } else if (typeof document === 'undefined' && proxy.$ssrContext) {
      const nonce = proxy.$vuetify.options?.cspNonce
        ? ` nonce="${proxy.$vuetify.options.cspNonce}"`
        : ''
      proxy.$ssrContext.head = proxy.$ssrContext.head || ''
      proxy.$ssrContext.head += `<style type="text/css" id="vuetify-theme-stylesheet"${nonce}>${generatedStyles.value}</style>`
    } else if (typeof document !== 'undefined') {
      genStyle()
      applyTheme()
    }
  }

  if (proxy) {
    Object.assign(proxy, {
      metaInfo: () => vueMeta.value,
      head: () => vueMeta.value
    })
  }

  watch(generatedStyles, () => {
    if (!proxy?.meta) applyTheme()
  })

  initTheme()

  return {
    applyTheme,
    genStyle,
    generatedStyles,
    parsedTheme,
    vueMeta
  }
}
