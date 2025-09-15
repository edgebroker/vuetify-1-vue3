import { inject } from 'vue'

export default function useRegistrableInject (namespace, child, parent) {
  const defaultImpl = child && parent ? {
    register: () => console.warn(`[Vuetify] The ${child} component must be used inside a ${parent}`),
    unregister: () => console.warn(`[Vuetify] The ${child} component must be used inside a ${parent}`)
  } : null

  return inject(namespace, defaultImpl)
}

