import { deepEqual } from '../utl/helpers'

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
