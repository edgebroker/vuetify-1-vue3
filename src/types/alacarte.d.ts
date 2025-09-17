declare module 'vuetify/es5/components/Vuetify' {
  import type { Vuetify } from 'vuetify'

  const VuetifyPlugin: Vuetify

  export default VuetifyPlugin
}

declare module 'vuetify/es5/components/*' {
  import type { ComponentOrPack } from 'vuetify'

  const VuetifyComponent: {
    default: ComponentOrPack
    [key: string]: ComponentOrPack
  }

  export = VuetifyComponent
}

declare module 'vuetify/es5/directives' {
  import type { ObjectDirective } from 'vue'

  const ClickOutside: ObjectDirective
  const Ripple: ObjectDirective
  const Resize: ObjectDirective
  const Scroll: ObjectDirective
  const Touch: ObjectDirective

  export {
    ClickOutside,
    Ripple,
    Resize,
    Scroll,
    Touch
  }
}
