import { ref } from 'vue'

export interface DelayableProps {
  openDelay: number | string
  closeDelay: number | string
}

export default function useDelayable (props: DelayableProps) {
  const openTimeout = ref<ReturnType<typeof setTimeout> | undefined>()
  const closeTimeout = ref<ReturnType<typeof setTimeout> | undefined>()

  function clearDelay () {
    clearTimeout(openTimeout.value)
    clearTimeout(closeTimeout.value)
    openTimeout.value = undefined
    closeTimeout.value = undefined
  }

  function runDelay (type: 'open' | 'close', cb?: () => void) {
    clearDelay()

    const delay = parseInt(String(props[`${type}Delay` as keyof DelayableProps]), 10)

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
    runDelay
  }
}
