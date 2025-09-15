import { computed, provide, reactive } from 'vue'

export default function useButtonGroup (props: any = {}) {
  const state = reactive<{ items: any[] }>({
    items: []
  })

  function register (item: any) {
    state.items.push(item)
  }

  function unregister (item: any) {
    const index = state.items.indexOf(item)
    if (index !== -1) state.items.splice(index, 1)
  }

  const activeClass = computed(() => props.activeClass || 'v-btn--active')

  const classes = computed(() => ({}))

  const selectedItems = computed(() => state.items.filter(i => i.isActive))

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
    classes,
    items: state.items,
    selectedItems
  }
}
