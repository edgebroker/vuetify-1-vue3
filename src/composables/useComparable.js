import { deepEqual } from '../../packages/vuetify/src/util/helpers'

export const comparableProps = {
  valueComparator: {
    type: Function,
    default: deepEqual,
  },
}

export default function useComparable (props) {
  const valueComparator = props.valueComparator || deepEqual

  return { valueComparator }
}
