import { toRef } from 'vue'

export const filterableProps = {
  noDataText: {
    type: String,
    default: '$vuetify.noDataText'
  }
}

export default function useFilterable (props) {
  const noDataText = toRef(props, 'noDataText')

  return {
    noDataText
  }
}
