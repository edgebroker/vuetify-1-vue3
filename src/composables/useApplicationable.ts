import { getCurrentInstance, ref, computed, watch, onMounted, onActivated, onDeactivated, onBeforeUnmount, unref } from 'vue'

export default function useApplicationable (props, value, events = [], options = {}) {
  const vm = getCurrentInstance()
  const app = ref(props.app)
  let updateFn = typeof options.updateApplication === 'function'
    ? options.updateApplication
    : () => 0

  watch(() => props.app, val => {
    app.value = val
  })

  const applicationProperty = computed(() => unref(value))

  function updateApplication () {
    return updateFn()
  }

  function callUpdate () {
    if (!app.value) return

    vm?.proxy.$vuetify.application.bind(
      vm.uid,
      applicationProperty.value,
      updateApplication()
    )
  }

  function removeApplication (force = false) {
    if (!force && !app.value) return

    vm?.proxy.$vuetify.application.unbind(
      vm.uid,
      applicationProperty.value
    )
  }

  function setUpdateApplication (fn) {
    updateFn = fn
    callUpdate()
  }

  watch(app, (val, prev) => {
    if (prev) removeApplication(true)
    else callUpdate()
  })

  watch(applicationProperty, (val, oldVal) => {
    vm?.proxy.$vuetify.application.unbind(vm.uid, oldVal)
    callUpdate()
  })

  events.forEach(event => {
    watch(() => props[event], callUpdate)
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
