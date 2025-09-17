import { getCurrentInstance, ref, computed, watch, onMounted, onActivated, onDeactivated, onBeforeUnmount, unref } from 'vue'
import type { ComputedRef, ComponentInternalInstance, ComponentPublicInstance, Ref } from 'vue'

type ApplicationPropertySource = string | Ref<string> | ComputedRef<string>

interface UseApplicationableOptions {
  updateApplication?: () => number
}

interface ApplicationFramework {
  bind: (uid: number, target: string, value: number) => void
  unbind: (uid: number, target: string) => void
}

type ApplicationableProxy = ComponentPublicInstance & {
  $vuetify: {
    application: ApplicationFramework
  }
}

type ApplicationableProps = Record<string, unknown> & {
  app?: boolean
}

export default function useApplicationable<P extends ApplicationableProps> (
  props: P,
  value: ApplicationPropertySource,
  events: Array<keyof P & string> = [],
  options: UseApplicationableOptions = {}
) {
  const vm = getCurrentInstance() as ComponentInternalInstance | null
  const proxy = vm?.proxy as ApplicationableProxy | undefined
  const app = ref(Boolean(props.app))

  let updateFn: () => number = typeof options.updateApplication === 'function'
    ? options.updateApplication
    : () => 0

  watch(() => props.app, val => {
    app.value = Boolean(val)
  })

  const applicationProperty = computed<string>(() => unref(value))

  function updateApplication () {
    return updateFn()
  }

  function callUpdate () {
    if (!app.value || !vm || !proxy) return

    proxy.$vuetify.application.bind(
      vm.uid,
      applicationProperty.value,
      updateApplication()
    )
  }

  function removeApplication (force = false) {
    if ((!force && !app.value) || !vm || !proxy) return

    proxy.$vuetify.application.unbind(
      vm.uid,
      applicationProperty.value
    )
  }

  function setUpdateApplication (fn: typeof updateFn) {
    updateFn = fn
    callUpdate()
  }

  watch(app, (_val, prev) => {
    if (prev) removeApplication(true)
    else callUpdate()
  })

  watch(applicationProperty, (_val, oldVal) => {
    if (!vm || !proxy) return

    proxy.$vuetify.application.unbind(vm.uid, oldVal)
    callUpdate()
  })

  events.forEach(event => {
    watch(() => props[event], () => {
      callUpdate()
    })
  })

  onMounted(callUpdate)
  onActivated(callUpdate)
  onDeactivated(() => removeApplication())
  onBeforeUnmount(() => removeApplication())

  return {
    app,
    applicationProperty,
    callUpdate,
    removeApplication,
    updateApplication,
    setUpdateApplication
  }
}
