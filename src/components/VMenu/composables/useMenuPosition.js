import { ref } from 'vue'

export default function useMenuPosition (props, {
  contentRef,
  dimensions,
  computedTop,
  isAttached,
  defaultOffset,
  tiles,
  selectedIndex
}) {
  const calculatedTopAuto = ref(0)

  function calcScrollPosition () {
    const content = contentRef.value
    if (!content) return 0

    const activeTile = content.querySelector('.v-list__tile--active')
    const maxScrollTop = content.scrollHeight - content.offsetHeight

    if (!activeTile) return content.scrollTop

    return Math.min(
      maxScrollTop,
      Math.max(0, activeTile.offsetTop - content.offsetHeight / 2 + activeTile.offsetHeight / 2)
    )
  }

  function calcLeftAuto () {
    if (isAttached.value) return 0

    const left = dimensions.activator.left
    return parseInt(left - defaultOffset * 2) || 0
  }

  function calcTopAuto () {
    const content = contentRef.value
    if (!content) return computedTop.value

    const activeTile = content.querySelector('.v-list__tile--active')
    if (!activeTile) {
      selectedIndex.value = null
      return computedTop.value
    }

    if (props.offsetY) return computedTop.value

    selectedIndex.value = tiles.value.indexOf(activeTile)

    const tileDistanceFromMenuTop = activeTile.offsetTop - calcScrollPosition()
    const firstTile = content.querySelector('.v-list__tile')
    const firstTileOffsetTop = firstTile ? firstTile.offsetTop : 0

    return computedTop.value - tileDistanceFromMenuTop - firstTileOffsetTop
  }

  return {
    calculatedTopAuto,
    calcScrollPosition,
    calcLeftAuto,
    calcTopAuto
  }
}
