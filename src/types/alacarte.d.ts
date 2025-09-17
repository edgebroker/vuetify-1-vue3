declare module 'vuetify/components/Vuetify' {
  const VuetifyPlugin: import('vuetify').Vuetify

  export default VuetifyPlugin
}

declare module 'vuetify/components/*' {
  const VuetifyComponent: {
    default: import('vuetify').ComponentOrPack
    [key: string]: import('vuetify').ComponentOrPack
  }

  export = VuetifyComponent
}

declare module 'vuetify/directives' {
  const ClickOutside: import('vue').ObjectDirective
  const Ripple: import('vue').ObjectDirective
  const Resize: import('vue').ObjectDirective
  const Scroll: import('vue').ObjectDirective
  const Touch: import('vue').ObjectDirective

  export {
    ClickOutside,
    Ripple,
    Resize,
    Scroll,
    Touch
  }
}
