import { ref, watch, nextTick } from 'vue'
import { keyCodes } from '../../../util/helpers'

export default function useMenuKeyable (props, {
  contentRef,
  isActive,
  getActivator
}) {
  const listIndex = ref(-1)
  const tiles = ref([])

  watch(isActive, val => {
    if (!val) listIndex.value = -1
  })

  watch(listIndex, (next, prev) => {
    const currentTiles = tiles.value
    if (next in currentTiles) {
      const tile = currentTiles[next]
      tile.classList.add('v-list__tile--highlighted')
      const content = contentRef.value
      if (content) {
        content.scrollTop = tile.offsetTop - tile.clientHeight
      }
    }

    if (prev in currentTiles) {
      currentTiles[prev].classList.remove('v-list__tile--highlighted')
    }
  })

  function getTiles () {
    const content = contentRef.value
    tiles.value = content ? Array.from(content.querySelectorAll('.v-list__tile')) : []
  }

  function changeListIndex (e) {
    getTiles()

    if (e.keyCode === keyCodes.down && listIndex.value < tiles.value.length - 1) {
      listIndex.value++
    } else if (e.keyCode === keyCodes.up && listIndex.value > -1) {
      listIndex.value--
    } else if (e.keyCode === keyCodes.enter && listIndex.value !== -1) {
      const tile = tiles.value[listIndex.value]
      tile && tile.click()
    } else {
      return
    }

    e.preventDefault()
  }

  function onKeyDown (e) {
    if (props.disableKeys) return

    if (e.keyCode === keyCodes.esc) {
      isActive.value = false
      nextTick(() => {
        const activator = getActivator()
        activator && activator.focus && activator.focus()
      })
    } else if (e.keyCode === keyCodes.tab) {
      setTimeout(() => {
        const content = contentRef.value
        if (!content) return
        if (!content.contains(document.activeElement)) {
          isActive.value = false
        }
      })
    } else {
      changeListIndex(e)
    }
  }

  return {
    listIndex,
    tiles,
    getTiles,
    changeListIndex,
    onKeyDown
  }
}
