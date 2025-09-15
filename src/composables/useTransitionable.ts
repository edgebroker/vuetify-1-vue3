import { toRef } from 'vue'

export const transitionableProps = {
  mode: String,
  origin: String,
  transition: String
}

export default function useTransitionable (props) {
  const mode = toRef(props, 'mode')
  const origin = toRef(props, 'origin')
  const transition = toRef(props, 'transition')

  return {
    mode,
    origin,
    transition
  }
}
