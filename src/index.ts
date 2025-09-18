import "@/css/vuetify.css"
import VuetifyComponent from './components/Vuetify'
import * as components from './components'
import directives from './directives'
import type { App, Plugin } from 'vue'
import { Vuetify as VuetifyPlugin, VuetifyUseOptions } from './types'

const Vuetify: VuetifyPlugin = {
  install (app: App, args?: VuetifyUseOptions): void {
    app.use(VuetifyComponent as unknown as Plugin, {
      components,
      directives,
      ...args
    })
  },
  version: __VUETIFY_VERSION__
}

if (typeof window !== 'undefined' && window.Vue?.use) {
  window.Vue.use(Vuetify as unknown as Plugin)
}

export default Vuetify
export type { ComponentOrPack, Vuetify, VuetifyUseOptions } from './types'
export * from './components'
export * from './directives'
export * from './util/helpers'
