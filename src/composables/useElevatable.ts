import { computed } from 'vue'

export default function useElevatable (props) {
  const computedElevation = computed(() => props.elevation)

  const elevationClasses = computed(() => {
    const elevation = computedElevation.value
    if (!elevation && elevation !== 0) return {}
    return { [`elevation-${elevation}`]: true }
  })

  return {
    computedElevation,
    elevationClasses,
  }
}

