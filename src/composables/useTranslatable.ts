import { ref, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'

export default function useTranslatable (props, { objHeight } = {}) {
  if (typeof objHeight !== 'function') {
    throw new Error('useTranslatable requires objHeight callback')
  }

  const elOffsetTop = ref(0)
  const parallax = ref(0)
  const parallaxDist = ref(0)
  const percentScrolled = ref(0)
  const scrollTop = ref(0)
  const windowHeight = ref(0)
  const windowBottom = ref(0)

  const vm = getCurrentInstance()

  function calcDimensions () {
    const el = vm && vm.proxy && vm.proxy.$el
    if (!el) return

    const offset = el.getBoundingClientRect()

    scrollTop.value = window.pageYOffset
    parallaxDist.value = objHeight() - Number(props.height)
    elOffsetTop.value = offset.top + scrollTop.value
    windowHeight.value = window.innerHeight
    windowBottom.value = scrollTop.value + windowHeight.value
  }

  function translate () {
    calcDimensions()

    percentScrolled.value = (
      (windowBottom.value - elOffsetTop.value) /
      (parseInt(props.height, 10) + windowHeight.value)
    )

    parallax.value = Math.round(parallaxDist.value * percentScrolled.value)
  }

  onMounted(() => {
    window.addEventListener('scroll', translate, false)
    window.addEventListener('resize', translate, false)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', translate, false)
    window.removeEventListener('resize', translate, false)
  })

  return { parallax, translate }
}

