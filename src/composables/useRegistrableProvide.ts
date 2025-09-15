import { provide } from 'vue'

export default function useRegistrableProvide (namespace) {
  const children = []

  function register (child) {
    const index = children.indexOf(child)
    if (index < 0) children.push(child)
  }

  function unregister (child) {
    const index = children.indexOf(child)
    if (index !== -1) children.splice(index, 1)
  }

  provide(namespace, { register, unregister })

  return { children, register, unregister }
}

