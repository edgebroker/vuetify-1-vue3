import "@/css/vuetify.css"

// Components
import VCheckbox from '../VCheckbox'
import VDivider from '../VDivider'
import VSubheader from '../VSubheader'
import {
  VList,
  VListTile,
  VListTileAction,
  VListTileContent,
  VListTileTitle
} from '../VList'

// Composables
import useColorable, { colorProps } from '../../composables/useColorable'
import useThemeable, { themeProps } from '../../composables/useThemeable'

// Helpers
import {
  escapeHTML,
  getPropertyFromItem
} from '../../util/helpers'

// Types
import { defineComponent, computed, getCurrentInstance, h } from 'vue'

/* @vue/component */
export default defineComponent({
  name: 'v-select-list',

  props: {
    action: Boolean,
    dense: Boolean,
    hideSelected: Boolean,
    items: {
      type: Array,
      default: () => []
    },
    itemAvatar: {
      type: [String, Array, Function],
      default: 'avatar'
    },
    itemDisabled: {
      type: [String, Array, Function],
      default: 'disabled'
    },
    itemText: {
      type: [String, Array, Function],
      default: 'text'
    },
    itemValue: {
      type: [String, Array, Function],
      default: 'value'
    },
    noDataText: String,
    noFilter: Boolean,
    searchInput: {
      default: null
    },
    selectedItems: {
      type: Array,
      default: () => []
    },
    ...colorProps,
    ...themeProps
  },

  setup (props, { slots, emit }) {
    const { setTextColor } = useColorable(props)
    const { themeClasses } = useThemeable(props)
    const vm = getCurrentInstance()
    const parentProxy = vm?.proxy

    const parsedItems = computed(() => props.selectedItems.map(item => getValue(item)))

    const tileActiveClass = computed(() => {
      const colorData = setTextColor(props.color, {})
      const classes = colorData.class || {}
      return Object.keys(classes).join(' ')
    })

    const staticNoDataTile = computed(() => {
      const tile = {
        on: {
          mousedown: e => e.preventDefault()
        }
      }

      return h(VListTile, tile, [genTileContent(props.noDataText)])
    })

    function genAction (item, inputValue) {
      return h(VListTileAction, {
        on: {
          click: e => {
            e.stopPropagation()
            emit('select', item)
          }
        }
      }, [
        h(VCheckbox, {
          props: {
            color: props.color,
            inputValue
          }
        })
      ])
    }

    function genDivider (dividerProps) {
      return h(VDivider, { props: dividerProps })
    }

    function genHeader (headerProps) {
      return h(VSubheader, { props: headerProps }, headerProps.header)
    }

    function genHighlight (text) {
      return `<span class="v-list__tile__mask">${escapeHTML(text)}</span>`
    }

    function getMaskedCharacters (text) {
      const searchInput = (props.searchInput ?? '').toString().toLocaleLowerCase()
      const index = text.toLocaleLowerCase().indexOf(searchInput)

      if (index < 0) return { start: '', middle: text, end: '' }

      const start = text.slice(0, index)
      const middle = text.slice(index, index + searchInput.length)
      const end = text.slice(index + searchInput.length)
      return { start, middle, end }
    }

    function genFilteredText (text) {
      const value = (text || '').toString()

      if (!props.searchInput || props.noFilter) return escapeHTML(value)

      const { start, middle, end } = getMaskedCharacters(value)

      return `${escapeHTML(start)}${genHighlight(middle)}${escapeHTML(end)}`
    }

    function getAvatar (item) {
      return Boolean(getPropertyFromItem(item, props.itemAvatar, false))
    }

    function getDisabled (item) {
      return Boolean(getPropertyFromItem(item, props.itemDisabled, false))
    }

    function getText (item) {
      return String(getPropertyFromItem(item, props.itemText, item))
    }

    function getValue (item) {
      return getPropertyFromItem(item, props.itemValue, getText(item))
    }

    function hasItem (item) {
      return parsedItems.value.indexOf(getValue(item)) > -1
    }

    function needsTile (slotNodes) {
      if (!slotNodes || slotNodes.length !== 1) return true
      const vnode = slotNodes[0]
      const type = vnode && vnode.type
      if (!type) return true
      const name = typeof type === 'string'
        ? type
        : (type.options && type.options.name) || type.name
      return name !== 'v-list-tile'
    }

    function genTileContent (item) {
      const innerHTML = genFilteredText(item != null ? getText(item) : '')

      return h(VListTileContent, [
        h(VListTileTitle, {
          domProps: { innerHTML }
        })
      ])
    }

    function genTile (
      item,
      disabled = null,
      avatar = false,
      value = hasItem(item)
    ) {
      if (item === Object(item)) {
        avatar = getAvatar(item)
        disabled = disabled !== null
          ? disabled
          : getDisabled(item)
      }

      const tile = {
        on: {
          mousedown: e => {
            e.preventDefault()
          },
          click: () => disabled || emit('select', item)
        },
        props: {
          activeClass: tileActiveClass.value,
          avatar,
          disabled,
          ripple: true,
          value,
          color: props.color
        }
      }

      if (!slots.item) {
        return h(VListTile, tile, [
          props.action && !props.hideSelected && props.items.length > 0
            ? genAction(item, value)
            : null,
          genTileContent(item)
        ])
      }

      const scopedSlot = slots.item({ parent: parentProxy, item, tile })
      const slotNodes = Array.isArray(scopedSlot) ? scopedSlot : [scopedSlot]

      return needsTile(slotNodes)
        ? h(VListTile, tile, slotNodes)
        : slotNodes[0]
    }

    return () => {
      const children = []
      for (const item of props.items) {
        if (props.hideSelected && hasItem(item)) continue

        if (item == null) children.push(genTile(item))
        else if (item && item.header) children.push(genHeader(item))
        else if (item && item.divider) children.push(genDivider(item))
        else children.push(genTile(item))
      }

      if (!children.length) {
        const noDataSlot = slots['no-data']?.()
        if (noDataSlot && noDataSlot.length) children.push(...noDataSlot)
        else children.push(staticNoDataTile.value)
      }

      const prependSlot = slots['prepend-item']?.()
      if (prependSlot && prependSlot.length) children.unshift(...prependSlot)

      const appendSlot = slots['append-item']?.()
      if (appendSlot && appendSlot.length) children.push(...appendSlot)

      return h('div', {
        staticClass: 'v-select-list v-card',
        class: themeClasses.value
      }, [
        h(VList, {
          props: {
            dense: props.dense
          }
        }, children)
      ])
    }
  }
})
