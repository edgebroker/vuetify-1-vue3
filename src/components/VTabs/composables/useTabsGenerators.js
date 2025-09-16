import { getCurrentInstance, h } from 'vue'

import VTabsItems from '../VTabsItems'
import VTabsSlider from '../VTabsSlider'
import VIcon from '../../VIcon'

export default function useTabsGenerators () {
  const vm = getCurrentInstance()
  const proxy = vm?.proxy

  function genIcon (direction) {
    if (!proxy?.hasArrows || !proxy?.[`${direction}IconVisible`]) return null

    return h(VIcon, {
      staticClass: `v-tabs__icon v-tabs__icon--${direction}`,
      disabled: !proxy[`${direction}IconVisible`],
      onClick: () => proxy?.scrollTo(direction)
    }, {
      default: () => proxy?.[`${direction}Icon`]
    })
  }

  function genTransition (direction) {
    return h('transition', { name: 'fade-transition' }, [genIcon(direction)])
  }

  function genContainer (items) {
    return h('div', {
      staticClass: 'v-tabs__container',
      class: {
        'v-tabs__container--align-with-title': proxy?.alignWithTitle,
        'v-tabs__container--centered': proxy?.centered,
        'v-tabs__container--fixed-tabs': proxy?.fixedTabs,
        'v-tabs__container--grow': proxy?.grow,
        'v-tabs__container--icons-and-text': proxy?.iconsAndText,
        'v-tabs__container--overflow': proxy?.isOverflowing,
        'v-tabs__container--right': proxy?.right
      },
      style: proxy?.containerStyles,
      ref: 'container'
    }, items)
  }

  function genWrapper (item) {
    return h('div', {
      staticClass: 'v-tabs__wrapper',
      class: {
        'v-tabs__wrapper--show-arrows': proxy?.hasArrows
      },
      ref: 'wrapper',
      directives: [{
        name: 'touch',
        value: {
          start: e => proxy?.overflowCheck && proxy.overflowCheck(e, proxy.onTouchStart),
          move: e => proxy?.overflowCheck && proxy.overflowCheck(e, proxy.onTouchMove),
          end: e => proxy?.overflowCheck && proxy.overflowCheck(e, proxy.onTouchEnd)
        }
      }]
    }, [item])
  }

  function genBar (items) {
    const data = proxy?.setBackgroundColor
      ? proxy.setBackgroundColor(proxy.color, {
        staticClass: 'v-tabs__bar',
        class: proxy?.themeClasses,
        ref: 'bar'
      })
      : {
        staticClass: 'v-tabs__bar',
        class: proxy?.themeClasses,
        ref: 'bar'
      }

    return h('div', data, [
      genTransition('prev'),
      genWrapper(genContainer(items)),
      genTransition('next')
    ])
  }

  function genItems (items, item) {
    if (items.length > 0) return items
    if (!item.length) return null

    return h(VTabsItems, item)
  }

  function genSlider (items) {
    let sliderItems = items

    if (!sliderItems.length) {
      sliderItems = [h(VTabsSlider, { color: proxy?.sliderColor })]
    }

    return h('div', {
      staticClass: 'v-tabs__slider-wrapper',
      style: proxy?.sliderStyles
    }, sliderItems)
  }

  return {
    genBar,
    genIcon,
    genItems,
    genTransition,
    genWrapper,
    genSlider
  }
}
