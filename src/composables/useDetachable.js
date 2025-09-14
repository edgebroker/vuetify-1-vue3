import { ref, watch, onBeforeMount, onMounted, onBeforeUnmount, onDeactivated, getCurrentInstance, nextTick } from 'vue'
import { consoleWarn } from '../util/console'

function validateAttachTarget (val) {
  const type = typeof val

  if (type === 'boolean' || type === 'string') return true

  return val && val.nodeType === Node.ELEMENT_NODE
}

export const detachableProps = {
  attach: {
    type: null,
    default: false,
    validator: validateAttachTarget,
  },
  contentClass: {
    type: String,
    default: '',
  },
}

export default function useDetachable (props, {
  activator: activatorNode,
  content: contentRef,
  isActive,
} = {}) {
  const hasDetached = ref(false)
  const vm = getCurrentInstance()

  function getScopeIdAttrs () {
    const scopeId = vm && vm.vnode && vm.vnode.scopeId
    return scopeId ? { [scopeId]: '' } : {}
  }

  function initDetach () {
    const content = contentRef && contentRef.value
    if (!content || hasDetached.value ||
      props.attach === '' ||
      props.attach === true ||
      props.attach === 'attach'
    ) return

    let target
    if (props.attach === false) {
      target = document.querySelector('[data-app]')
    } else if (typeof props.attach === 'string') {
      target = document.querySelector(props.attach)
    } else {
      target = props.attach
    }

    if (!target) {
      consoleWarn(`Unable to locate target ${props.attach || '[data-app]'}`, vm && vm.proxy)
      return
    }

    target.insertBefore(content, target.firstChild)
    hasDetached.value = true
  }

  watch(() => props.attach, () => {
    hasDetached.value = false
    initDetach()
  })

  if (contentRef) watch(contentRef, initDetach)

  onBeforeMount(() => {
    nextTick(() => {
      const el = vm && vm.proxy && vm.proxy.$el
      if (!el || !activatorNode || !activatorNode.value) return

      const activator = Array.isArray(activatorNode.value) ? activatorNode.value : [activatorNode.value]
      activator.forEach(node => {
        if (node.elm && el.parentNode) {
          el.parentNode.insertBefore(node.elm, el)
        }
      })
    })
  })

  onMounted(() => {
    if (!props.lazy) initDetach()
  })

  onDeactivated(() => {
    if (isActive) isActive.value = false
  })

  onBeforeUnmount(() => {
    try {
      const content = contentRef && contentRef.value
      if (content && content.parentNode) {
        content.parentNode.removeChild(content)
      }
      if (activatorNode && activatorNode.value) {
        const activator = Array.isArray(activatorNode.value) ? activatorNode.value : [activatorNode.value]
        activator.forEach(node => {
          if (node.elm && node.elm.parentNode) {
            node.elm.parentNode.removeChild(node.elm)
          }
        })
      }
    } catch (e) {
      console.log(e)
    }
  })

  return {
    hasDetached,
    initDetach,
    getScopeIdAttrs,
  }
}
