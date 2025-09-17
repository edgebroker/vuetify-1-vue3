import { defineComponent, h } from 'vue'
import type { SetupContext } from 'vue'

import VList from './VList'
import VListGroup from './VListGroup'
import VListTile from './VListTile'
import VListTileAction from './VListTileAction'
import VListTileAvatar from './VListTileAvatar'

export { VList, VListGroup, VListTile, VListTileAction, VListTileAvatar }

type Attrs = Record<string, unknown> & {
  class?: unknown
  style?: unknown
}

function createTileComponent (name: string, tag: string, baseClass: string) {
  return defineComponent({
    name,
    inheritAttrs: false,
    setup (_props: Record<string, never>, context: SetupContext) {
      const { attrs, slots } = context

      return () => {
        const { class: className, style, ...restAttrs } = attrs as Attrs

        return h(tag, {
          class: [baseClass, className],
          style: style as any,
          ...restAttrs
        }, slots.default?.())
      }
    }
  })
}

export const VListTileActionText = createTileComponent('v-list-tile-action-text', 'span', 'v-list__tile__action-text')
export const VListTileContent = createTileComponent('v-list-tile-content', 'div', 'v-list__tile__content')
export const VListTileTitle = createTileComponent('v-list-tile-title', 'div', 'v-list__tile__title')
export const VListTileSubTitle = createTileComponent('v-list-tile-sub-title', 'div', 'v-list__tile__sub-title')

export default {
  $_vuetify_subcomponents: {
    VList,
    VListGroup,
    VListTile,
    VListTileAction,
    VListTileActionText,
    VListTileAvatar,
    VListTileContent,
    VListTileSubTitle,
    VListTileTitle
  }
}
