import { ref } from 'vue'

export default function useDelayable (props) {
  const openTimeout = ref()
  const closeTimeout = ref()

  function clearDelay () {
    clearTimeout(openTimeout.value)
    clearTimeout(closeTimeout.value)
    openTimeout.value = undefined
    closeTimeout.value = undefined
  }

  function runDelay (type, cb) {
    clearDelay()

    const delay = parseInt(props[`${type}Delay`], 10)

    const timeout = setTimeout(() => {
      cb && cb()
    }, delay)

    if (type === 'open') {
      openTimeout.value = timeout
    } else {
      closeTimeout.value = timeout
    }
  }

  return {
    clearDelay,
    runDelay,
  }
}
