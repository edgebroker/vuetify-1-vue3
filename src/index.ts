import "@/css/vuetify.css"
import * as components from './components'
import directives from './directives'
import type {App} from 'vue'
import {Vuetify as VuetifyPlugin, VuetifyUseOptions} from './types'

const Vuetify: VuetifyPlugin = {
    install(app: App, args?: VuetifyUseOptions): void {
        console.log("[Vuetify-1-vue3] install() called")
        for (const compKey in components) {
            const comp = (components as Record<string, any>)[compKey]
            if (comp && comp.name) {
                console.log("[Vuetify-1-vue3] Registering component:", comp.name)
                app.component(comp.name, comp)
            }
        }

        for (const name in directives) {
            const directive = (directives as Record<string, any>)[name]
            if (directive) {
                console.log("[Vuetify-1-vue3] Registering directive:", name)
                app.directive(name, directive)
            }
        }
    },
    version: __VUETIFY_VERSION__
}
export type {ComponentOrPack, VuetifyUseOptions} from './types'
export * from './components'
export * from './directives'
export * from './util/helpers'
export default Vuetify;
