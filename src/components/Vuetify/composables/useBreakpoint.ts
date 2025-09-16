import { reactive } from 'vue'
import { VuetifyBreakpoint, VuetifyBreakpointOptions, VuetifyUseOptions } from '../../../types'

const BREAKPOINTS_DEFAULTS: VuetifyBreakpointOptions = {
  thresholds: {
    xs: 600,
    sm: 960,
    md: 1280,
    lg: 1920
  },
  scrollbarWidth: 16
}

export default function useBreakpoint (opts: VuetifyUseOptions['breakpoint'] = {}): VuetifyBreakpoint {
  const options = ((opts === false || opts == null) ? {} : opts) as Partial<VuetifyBreakpointOptions>

  const thresholds = {
    ...BREAKPOINTS_DEFAULTS.thresholds,
    ...(options.thresholds || {})
  }
  const scrollbarWidth = options.scrollbarWidth != null
    ? options.scrollbarWidth
    : BREAKPOINTS_DEFAULTS.scrollbarWidth

  const state = reactive({
    xs: false,
    sm: false,
    md: false,
    lg: false,
    xl: false,
    name: 'xs',
    xsOnly: false,
    smOnly: false,
    smAndDown: false,
    smAndUp: false,
    mdOnly: false,
    mdAndDown: false,
    mdAndUp: false,
    lgOnly: false,
    lgAndDown: false,
    lgAndUp: false,
    xlOnly: false,
    width: getClientWidth(),
    height: getClientHeight(),
    thresholds,
    scrollbarWidth
  }) as VuetifyBreakpoint

  let resizeTimeout: number | undefined

  function update (): void {
    const { width, thresholds, scrollbarWidth } = state

    const xs = width < thresholds.xs
    const sm = width < thresholds.sm && !xs
    const md = width < (thresholds.md - scrollbarWidth) && !(sm || xs)
    const lg = width < (thresholds.lg - scrollbarWidth) && !(md || sm || xs)
    const xl = width >= (thresholds.lg - scrollbarWidth)

    state.xs = xs
    state.sm = sm
    state.md = md
    state.lg = lg
    state.xl = xl

    state.xsOnly = xs
    state.smOnly = sm
    state.smAndDown = (xs || sm) && !(md || lg || xl)
    state.smAndUp = !xs && (sm || md || lg || xl)
    state.mdOnly = md
    state.mdAndDown = (xs || sm || md) && !(lg || xl)
    state.mdAndUp = !(xs || sm) && (md || lg || xl)
    state.lgOnly = lg
    state.lgAndDown = (xs || sm || md || lg) && !xl
    state.lgAndUp = !(xs || sm || md) && (lg || xl)
    state.xlOnly = xl

    if (xs) state.name = 'xs'
    else if (sm) state.name = 'sm'
    else if (md) state.name = 'md'
    else if (lg) state.name = 'lg'
    else state.name = 'xl'
  }

  function setDimensions (): void {
    state.height = getClientHeight()
    state.width = getClientWidth()
    update()
  }

  function onResize (): void {
    if (resizeTimeout != null) window.clearTimeout(resizeTimeout)

    resizeTimeout = window.setTimeout(setDimensions, 200)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', onResize, { passive: true })
  }

  setDimensions()

  return state
}

function getClientWidth (): number {
  if (typeof document === 'undefined') return 0
  return Math.max(
    document.documentElement!.clientWidth,
    window.innerWidth || 0
  )
}

function getClientHeight (): number {
  if (typeof document === 'undefined') return 0
  return Math.max(
    document.documentElement!.clientHeight,
    window.innerHeight || 0
  )
}
