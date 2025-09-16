import { h, unref } from 'vue'

export default function useDataTableProgress (options) {
  const { genProgress, genTR, headerColumns } = options

  function genTProgress () {
    const progress = typeof genProgress === 'function' ? genProgress() : null

    const col = h('th', {
      class: 'column',
      colspan: unref(headerColumns)
    }, [progress])

    return genTR([col], { class: 'v-datatable__progress' })
  }

  return { genTProgress }
}
