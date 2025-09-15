import { getCurrentInstance, ref, computed, watch, onMounted, onActivated, onDeactivated, onBeforeUnmount, unref } from 'vue'

export default function useApplicationable (props, value, events = []) {
  const vm = getCurrentInstance()
  const app = ref(props.app)

  watch(() => props.app, val => {
    app.value = val
  })

  const applicationProperty = computed(() => unref(value))

  function updateApplication () {
    return 0
  }

  function bind () {
    if (!app.value) return

    vm?.proxy.$vuetify.application.bind(
      vm.uid,
      applicationProperty.value,
      updateApplication()
    )
  }

  function unbind (force = false) {
    if (!force && !app.value) return

    vm?.proxy.$vuetify.application.unbind(
      vm.uid,
      applicationProperty.value
    )
  }

  watch(app, (val, prev) => {
    prev ? unbind(true) : bind()
  })

  watch(applicationProperty, (val, oldVal) => {
    vm?.proxy.$vuetify.application.unbind(vm.uid, oldVal)
  })

  events.forEach(event => {
    watch(() => props[event], bind)
  })

  onMounted(bind)
  onActivated(bind)
  onDeactivated(() => unbind())
  onBeforeUnmount(() => unbind())

  return {
    app,
    applicationProperty,
    bind,
    unbind,
    updateApplication
  }
}
