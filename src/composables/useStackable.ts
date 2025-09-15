import { computed, getCurrentInstance, ref } from 'vue'
import { getZIndex } from '../utl/helpers'

export default function useStackable () {
  const { proxy } = getCurrentInstance()

  const stackClass = ref('unpecified')
  const stackElement = ref(null)
  const stackExclude = ref(null)
  const stackMinZIndex = ref(0)
  const isActive = ref(false)

  function getMaxZIndex (exclude = []) {
    const base = proxy.$el
    const zis = [stackMinZIndex.value, getZIndex(base)]
    const activeElements = [...document.getElementsByClassName(stackClass.value)]

    for (let index = 0; index < activeElements.length; index++) {
      if (!exclude.includes(activeElements[index])) {
        zis.push(getZIndex(activeElements[index]))
      }
    }

    return Math.max(...zis)
  }

  const activeZIndex = computed(() => {
    if (typeof window === 'undefined') return 0

    const content = stackElement.value || (proxy.$refs && proxy.$refs.content)
    const index = !isActive.value
      ? getZIndex(content)
      : getMaxZIndex(stackExclude.value || [content]) + 2

    if (index == null) return index

    return parseInt(index)
  })

  return {
    stackClass,
    stackElement,
    stackExclude,
    stackMinZIndex,
    isActive,
    getMaxZIndex,
    activeZIndex
  }
}
