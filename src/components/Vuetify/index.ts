import { App, Component, reactive } from 'vue'
import { version as VueVersion } from 'vue'

import useApplication from './composables/useApplication'
import useBreakpoint from './composables/useBreakpoint'
import useTheme from './composables/useTheme'
import useIcons from './composables/useIcons'
import useOptions from './composables/useOptions'
import useLang from './composables/useLang'
import goTo, { setGoToApplication } from './goTo'

// Utils
import { consoleWarn } from '../../util/console'

// Types
import { ComponentOrPack, Vuetify as VuetifyPlugin, VuetifyUseOptions } from '../../types'

const installedApps = new WeakSet<App>()

const Vuetify: VuetifyPlugin = {
  install (app, opts = {}) {
    if (installedApps.has(app)) return
    installedApps.add(app)

    checkVueVersion(app)

    const application = useApplication()
    const breakpoint = useBreakpoint(opts.breakpoint)
    const lang = useLang(opts.lang)
    const vuetify = reactive({
      application,
      breakpoint,
      dark: false,
      icons: useIcons(opts.iconfont, opts.icons),
      lang,
      options: useOptions(opts.options),
      rtl: opts.rtl ?? false,
      theme: useTheme(opts.theme),
      goTo,
      t: lang.t.bind(lang)
    })

    setGoToApplication(application)

    app.config.globalProperties.$vuetify = vuetify

    if (opts.directives) {
      for (const name in opts.directives) {
        app.directive(name, opts.directives[name])
      }
    }

    registerComponents(app, opts.components)
  },
  version: __VUETIFY_VERSION__
}

function registerComponents (app: App, components?: VuetifyUseOptions['components']): boolean {
  if (!components) return false

  for (const key in components) {
    const component = components[key]

    if (!component) continue

    const subcomponents = (component as ComponentOrPack).$_vuetify_subcomponents
    if (subcomponents && registerComponents(app, subcomponents)) continue

    if (typeof component === 'object' || typeof component === 'function') {
      app.component(key, component as Component)
    }
  }

  return true
}

export function checkVueVersion (app: App | { version: string }, requiredVue?: string) {
  const vueDep = requiredVue || __REQUIRED_VUE__

  const required = vueDep.split('.', 3).map(v => v.replace(/\D/g, '')).map(Number)
  const version = (app.version || VueVersion).split('.', 3).map(n => parseInt(n, 10))

  // Simple semver caret range comparison
  const passes =
    version[0] === required[0] && // major matches
    (version[1] > required[1] || // minor is greater
      (version[1] === required[1] && version[2] >= required[2]) // or minor is eq and patch is >=
    )

  if (!passes) {
    consoleWarn(`Vuetify requires Vue version ${vueDep}`)
  }
}

export default Vuetify
