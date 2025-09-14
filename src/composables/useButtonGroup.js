import { computed, provide, reactive } from 'vue'

export default function useButtonGroup (props = {}) {
  const state = reactive({
    items: []
  })

  function register (item) {
    state.items.push(item)
  }

  function unregister (item) {
    const index = state.items.indexOf(item)
    if (index !== -1) state.items.splice(index, 1)
  }

  const activeClass = computed(() => props.activeClass || 'v-btn--active')

  const classes = computed(() => ({ }))

  const btnToggle = {
    register,
    unregister,
    activeClass: activeClass.value
  }

  provide('btnToggle', btnToggle)

  return {
    register,
    unregister,
    activeClass,
    classes
  }
}
