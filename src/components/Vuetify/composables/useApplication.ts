import { reactive } from 'vue'
import { VuetifyApplication } from '../../../types'

export type TargetProp = 'bar' | 'bottom' | 'footer' | 'insetFooter' | 'left' | 'right' | 'top'

interface TargetPropValues {
  [uid: number]: number
}

interface ApplicationState extends VuetifyApplication {
  insetFooter: number
}

type ApplicationComponents = Record<TargetProp, TargetPropValues>

export default function useApplication (): ApplicationState {
  const components: ApplicationComponents = {
    bar: {},
    bottom: {},
    footer: {},
    insetFooter: {},
    left: {},
    right: {},
    top: {}
  }

  const state = reactive({
    bar: 0,
    bottom: 0,
    footer: 0,
    insetFooter: 0,
    left: 0,
    right: 0,
    top: 0,
    bind,
    unbind,
    update
  }) as ApplicationState

  function bind (uid: number, target: TargetProp, value: number): void {
    if (!components[target]) return

    components[target] = { [uid]: value }
    update(target)
  }

  function unbind (uid: number, target: TargetProp): void {
    const targetComponents = components[target]
    if (targetComponents[uid] == null) return

    delete targetComponents[uid]
    update(target)
  }

  function update (target: TargetProp): void {
    const values = Object.values(components[target])
    state[target] = values.reduce((acc: number, cur: number) => (acc + cur), 0)
  }

  return state
}
