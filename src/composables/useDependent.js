import { getCurrentInstance, ref, watch } from 'vue'

function searchChildren (children) {
  const results = []

  for (let index = 0; index < children.length; index++) {
    const child = children[index]

    if (child.isActive && child.isDependent) {
      results.push(child)
    } else if (child.$children) {
      results.push(...searchChildren(child.$children))
    }
  }

  return results
}

export default function useDependent () {
  const { proxy } = getCurrentInstance()

  const closeDependents = ref(true)
  const isActive = ref(false)
  const isDependent = ref(true)

  function getOpenDependents () {
    if (closeDependents.value) return searchChildren(proxy.$children || [])

    return []
  }

  function getOpenDependentElements () {
    const result = []
    const openDependents = getOpenDependents()

    for (let index = 0; index < openDependents.length; index++) {
      result.push(...openDependents[index].getClickableDependentElements())
    }

    return result
  }

  function getClickableDependentElements () {
    const result = [proxy.$el]

    const content = proxy.$refs && proxy.$refs.content
    if (content) result.push(content)
    if (proxy.overlay) result.push(proxy.overlay)

    result.push(...getOpenDependentElements())

    return result
  }

  watch(isActive, val => {
    if (val) return

    const openDependents = getOpenDependents()
    for (let index = 0; index < openDependents.length; index++) {
      openDependents[index].isActive = false
    }
  })

  return {
    closeDependents,
    isActive,
    isDependent,
    getOpenDependents,
    getOpenDependentElements,
    getClickableDependentElements
  }
}
