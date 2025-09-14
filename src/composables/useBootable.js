import { ref, computed, watch } from 'vue'

export default function useBootable (props, opts = {}) {
  const isBooted = ref(false)

  const hasContent = computed(() => {
    return isBooted.value || !props.lazy || (opts.isActive && opts.isActive.value)
  })

  if (opts.isActive) {
    watch(opts.isActive, () => {
      isBooted.value = true
    })
  }

  function showLazyContent (content) {
    return hasContent.value ? content : undefined
  }

  return {
    isBooted,
    hasContent,
    showLazyContent,
  }
}

