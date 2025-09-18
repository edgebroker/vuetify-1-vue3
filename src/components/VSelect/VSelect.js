// Styles
import "@/css/vuetify.css"

// Components
import VChip from '../VChip'
import VMenu from '../VMenu'
import VSelectList from './VSelectList'

// Extensions
import VTextField, { useTextFieldController } from '../VTextField/VTextField'

// Composables
import useColorable from '../../composables/useColorable'
import useComparable, { comparableProps } from '../../composables/useComparable'
import useFilterable, { filterableProps } from '../../composables/useFilterable'

// Directives
import ClickOutside from '../../directives/click-outside'

// Helpers
import { camelize, getPropertyFromItem, keyCodes } from '../../util/helpers'
import { consoleError, consoleWarn } from '../../util/console'

// Types
import { defineComponent, reactive, ref, watch, computed, getCurrentInstance, h, nextTick, onBeforeUnmount, onMounted } from 'vue'

export const defaultMenuProps = {
  closeOnClick: false,
  closeOnContentClick: false,
  openOnClick: false,
  maxHeight: 300
}

/* @vue/component */
export default defineComponent({
  name: 'v-select',

  extends: VTextField,

  directives: {
    ClickOutside
  },

  props: {
    appendIcon: {
      type: String,
      default: '$vuetify.icons.dropdown'
    },
    appendIconCb: Function,
    attach: {
      type: null,
      default: false
    },
    browserAutocomplete: {
      type: String,
      default: 'on'
    },
    cacheItems: Boolean,
    chips: Boolean,
    clearable: Boolean,
    deletableChips: Boolean,
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
    menuProps: {
      type: [String, Array, Object],
      default: () => defaultMenuProps
    },
    multiple: Boolean,
    openOnClear: Boolean,
    returnObject: Boolean,
    searchInput: {
      default: null
    },
    smallChips: Boolean,
    ...comparableProps,
    ...filterableProps
  },

  setup (props, { attrs, emit, expose, slots }) {
    const vm = getCurrentInstance()
    const proxy = vm?.proxy

    const { setTextColor } = useColorable(props)
    const { valueComparator } = useComparable(props)
    const { noDataText } = useFilterable(props)
    const {
      focus: textFieldFocus,
      blur: textFieldBlur,
      genInput: textFieldGenInput,
      genLabel: textFieldGenLabel
    } = useTextFieldController()

    const baseGenAffix = proxy?.genAffix ? proxy.genAffix.bind(proxy) : undefined
    const baseGenClearIcon = proxy?.genClearIcon ? proxy.genClearIcon.bind(proxy) : undefined
    const baseGenIconSlot = proxy?.genIconSlot ? proxy.genIconSlot.bind(proxy) : undefined
    const baseGenProgress = proxy?.genProgress ? proxy.genProgress.bind(proxy) : undefined
    const baseOnMouseUp = proxy?.onMouseUp ? proxy.onMouseUp.bind(proxy) : undefined

    const attrsInput = reactive({ role: 'combobox' })
    const cachedItems = ref(props.cacheItems ? props.items.slice() : [])
    const content = ref(null)
    const isBooted = ref(false)
    const isMenuActive = ref(false)
    const lastItem = ref(20)
    const lazyValue = ref(props.value !== undefined
      ? props.value
      : props.multiple ? [] : undefined)
    const menu = ref(null)
    const selectedIndex = ref(-1)
    const selectedItems = ref([])
    const keyboardLookupPrefix = ref('')
    const keyboardLookupLastTime = ref(0)

    function getDisabled (item) {
      return getPropertyFromItem(item, props.itemDisabled, false)
    }

    function getText (item) {
      return getPropertyFromItem(item, props.itemText, item)
    }

    function getValue (item) {
      return getPropertyFromItem(item, props.itemValue, getText(item))
    }

    function filterDuplicates (arr) {
      const uniqueValues = new Map()
      for (let index = 0; index < arr.length; ++index) {
        const item = arr[index]
        const val = getValue(item)

        if (!uniqueValues.has(val)) uniqueValues.set(val, item)
      }
      return Array.from(uniqueValues.values())
    }

    const allItems = computed(() => filterDuplicates(cachedItems.value.concat(props.items)))
    const computedItems = computed(() => allItems.value)
    const hasChips = computed(() => props.chips || props.smallChips)
    const isHidingSelected = computed(() => Boolean(props.hideSelected))
    const baseClasses = computed(() => proxy?.classes || {})
    const classes = computed(() => ({
      ...baseClasses.value,
      'v-select': true,
      'v-select--chips': hasChips.value,
      'v-select--chips--small': props.smallChips,
      'v-select--is-menu-active': isMenuActive.value
    }))
    const counterValue = computed(() => {
      return props.multiple
        ? selectedItems.value.length
        : (getText(selectedItems.value[0]) || '').toString().length
    })

    function closeConditional (e) {
      const target = e?.target
      const contentEl = content.value
      const root = proxy?.$el

      return (
        !vm?.isUnmounted &&
        !!contentEl &&
        !contentEl.contains(target) &&
        !!root &&
        !root.contains(target) &&
        target !== root
      )
    }

    function blur (e) {
      textFieldBlur && textFieldBlur(e)
      isMenuActive.value = false
      if (proxy) proxy.isFocused = false
      selectedIndex.value = -1
    }

    const directives = computed(() => {
      return proxy?.isFocused ? [{
        name: 'click-outside',
        value: blur,
        args: { closeConditional }
      }] : undefined
    })

    const dynamicHeight = computed(() => 'auto')
    const hasSlot = computed(() => Boolean(hasChips.value || slots.selection))
    const isDirty = computed(() => selectedItems.value.length > 0)

    function selectItem (item) {
      if (!props.multiple) {
        setValue(props.returnObject ? item : getValue(item))
        isMenuActive.value = false
      } else {
        const internal = (proxy?.internalValue || []).slice()
        const i = findExistingIndex(item)

        if (i !== -1) internal.splice(i, 1)
        else internal.push(item)

        setValue(internal.map(i => (props.returnObject ? i : getValue(i))))

        nextTick(() => {
          menu.value && typeof menu.value.updateDimensions === 'function' && menu.value.updateDimensions()
        })
      }
    }

    const listData = computed(() => {
      const scopeId = vm?.vnode?.scopeId
      return {
        attrs: scopeId ? { [scopeId]: true } : null,
        props: {
          action: props.multiple && !isHidingSelected.value,
          color: props.color,
          dense: props.dense,
          hideSelected: props.hideSelected,
          items: virtualizedItems.value,
          noDataText: proxy?.$vuetify?.t(noDataText.value),
          selectedItems: selectedItems.value,
          itemAvatar: props.itemAvatar,
          itemDisabled: props.itemDisabled,
          itemValue: props.itemValue,
          itemText: props.itemText
        },
        on: {
          select: selectItem
        },
        scopedSlots: {
          item: slots.item
        }
      }
    })

    const staticList = computed(() => {
      if (slots['no-data'] || slots['prepend-item'] || slots['append-item']) {
        consoleError('assert: staticList should not be called if slots are used')
      }

      return h(VSelectList, listData.value)
    })

    const menuCanShow = computed(() => true)

    const menuProps = computed(() => {
      let normalisedProps = typeof props.menuProps === 'string'
        ? props.menuProps.split(',')
        : props.menuProps

      if (Array.isArray(normalisedProps)) {
        normalisedProps = normalisedProps.reduce((acc, p) => {
          acc[p.trim()] = true
          return acc
        }, {})
      }

      const baseProps = {
        ...defaultMenuProps,
        value: menuCanShow.value && isMenuActive.value,
        nudgeBottom: proxy?.nudgeBottom
          ? proxy.nudgeBottom
          : normalisedProps && normalisedProps.offsetY ? 1 : 0
      }

      return Object.assign({}, baseProps, normalisedProps)
    })

    const virtualizedItems = computed(() => {
      return menuProps.value.auto
        ? computedItems.value
        : computedItems.value.slice(0, lastItem.value)
    })

    function focus (...args) {
      textFieldFocus && textFieldFocus(...args)
    }

    function activateMenu () {
      isMenuActive.value = true
    }

    function clearableCallback () {
      setValue(props.multiple ? [] : undefined)
      nextTick(() => {
        const inputRef = proxy?.$refs?.input
        inputRef && typeof inputRef.focus === 'function' && inputRef.focus()
      })

      if (props.openOnClear) isMenuActive.value = true
    }

    function findExistingIndex (item) {
      const itemValue = getValue(item)
      const internal = proxy?.internalValue || []
      return internal.findIndex(i => valueComparator(getValue(i), itemValue))
    }

    function genChipSelection (item, index) {
      const isDisabled = (
        props.disabled ||
        props.readonly ||
        getDisabled(item)
      )

      return h(VChip, {
        staticClass: 'v-chip--select-multi',
        attrs: { tabindex: -1 },
        props: {
          close: props.deletableChips && !isDisabled,
          disabled: isDisabled,
          selected: index === selectedIndex.value,
          small: props.smallChips
        },
        on: {
          click: e => {
            if (isDisabled) return

            e.stopPropagation()

            selectedIndex.value = index
          },
          input: () => onChipInput(item)
        },
        key: getValue(item)
      }, { default: () => getText(item) })
    }

    function genCommaSelection (item, index, last) {
      const key = JSON.stringify(getValue(item))
      const color = index === selectedIndex.value && props.color
      const isDisabled = props.disabled || getDisabled(item)

      return h('div', setTextColor(color, {
        staticClass: 'v-select__selection v-select__selection--comma',
        class: {
          'v-select__selection--disabled': isDisabled
        },
        key
      }), `${getText(item)}${last ? '' : ', '}`)
    }

    function genSlotSelection (item, index) {
      const slot = slots.selection
      return slot ? slot({
        parent: proxy,
        item,
        index,
        selected: index === selectedIndex.value,
        disabled: props.disabled || props.readonly
      }) : undefined
    }

    function genSelections () {
      let length = selectedItems.value.length
      const children = new Array(length)

      let genSelection
      if (slots.selection) {
        genSelection = genSlotSelection
      } else if (hasChips.value) {
        genSelection = genChipSelection
      } else {
        genSelection = genCommaSelection
      }

      while (length--) {
        children[length] = genSelection(
          selectedItems.value[length],
          length,
          length === children.length - 1
        )
      }

      return h('div', {
        staticClass: 'v-select__selections'
      }, children)
    }

    function genInput () {
      if (!textFieldGenInput) return null

      const input = textFieldGenInput()
      if (!input || !input.data) return input

      input.data.domProps = input.data.domProps || {}
      input.data.attrs = input.data.attrs || {}
      input.data.on = input.data.on || {}

      input.data.domProps.value = null
      input.data.attrs.readonly = true
      input.data.attrs['aria-readonly'] = String(props.readonly)
      input.data.on.keypress = onKeyPress

      return input
    }

    function genListWithSlot () {
      const slotNames = ['prepend-item', 'no-data', 'append-item']
        .filter(name => slots[name])
      const slotNodes = slotNames.map(name => h('template', { slot: name }, slots[name]?.()))

      return h(VSelectList, { ...listData.value }, slotNodes)
    }

    function genList () {
      if (slots['no-data'] || slots['prepend-item'] || slots['append-item']) {
        return genListWithSlot()
      }

      return staticList.value
    }

    function genMenu () {
      const propsData = { ...menuProps.value, activator: proxy?.$refs?.['input-slot'] }

      const menuPropDefinitions = VMenu.options?.props ?? VMenu.props ?? {}
      const inheritedProps = Object.keys(menuPropDefinitions)

      const deprecatedProps = Object.keys(attrs).reduce((acc, attr) => {
        if (inheritedProps.includes(camelize(attr))) acc.push(attr)
        return acc
      }, [])

      for (const prop of deprecatedProps) {
        propsData[camelize(prop)] = attrs[prop]
      }

      if (process.env.NODE_ENV !== 'production' && deprecatedProps.length) {
        const multiple = deprecatedProps.length > 1
        let replacement = deprecatedProps.reduce((acc, p) => {
          acc[camelize(p)] = attrs[p]
          return acc
        }, {})
        const propsString = deprecatedProps.map(p => `'${p}'`).join(', ')
        const separator = multiple ? '\n' : '\''

        const onlyBools = Object.keys(replacement).every(prop => {
          const propType = menuPropDefinitions[prop]
          const value = replacement[prop]
          return value === true || ((propType.type || propType) === Boolean && value === '')
        })

        if (onlyBools) {
          replacement = Object.keys(replacement).join(', ')
        } else {
          replacement = JSON.stringify(replacement, null, multiple ? 2 : 0)
            .replace(/"([^(")"]+)":/g, '$1:')
            .replace(/"/g, '\'')
        }

        consoleWarn(
          `${propsString} ${multiple ? 'are' : 'is'} deprecated, use ` +
          `${separator}${onlyBools ? '' : ':'}menu-props="${replacement}"${separator} instead`,
          proxy
        )
      }

      if (props.attach === '' || props.attach === true || props.attach === 'attach') {
        propsData.attach = proxy?.$el
      } else {
        propsData.attach = props.attach
      }

      return h(VMenu, {
        props: propsData,
        on: {
          input: val => {
            isMenuActive.value = val
            if (proxy) proxy.isFocused = val
          }
        },
        ref: menu
      }, [genList()])
    }

    function genDefaultSlot () {
      const selections = genSelections()
      const input = genInput()

      if (Array.isArray(selections)) {
        selections.push(input)
      } else if (selections) {
        selections.children = selections.children || []
        selections.children.push(input)
      }

      return [
        h('div', {
          staticClass: 'v-select__slot',
          directives: directives.value
        }, [
          textFieldGenLabel ? textFieldGenLabel() : null,
          props.prefix && baseGenAffix ? baseGenAffix('prefix') : null,
          selections,
          props.suffix && baseGenAffix ? baseGenAffix('suffix') : null,
          baseGenClearIcon ? baseGenClearIcon() : null,
          baseGenIconSlot ? baseGenIconSlot() : null
        ]),
        genMenu(),
        baseGenProgress ? baseGenProgress() : null
      ]
    }

    function getMenuIndex () {
      return menu.value ? menu.value.listIndex : -1
    }

    function onBlur (e) {
      if (e) emit('blur', e)
    }

    function onChipInput (item) {
      if (props.multiple) selectItem(item)
      else setValue(null)

      if (selectedItems.value.length === 0) {
        isMenuActive.value = true
      } else {
        isMenuActive.value = false
      }
      selectedIndex.value = -1
    }

    function onClick () {
      if (proxy?.isDisabled) return

      isMenuActive.value = true

      if (proxy && !proxy.isFocused) {
        proxy.isFocused = true
        emit('focus')
      }
    }

    function onEnterDown () {
      onBlur()
    }

    function onEscDown (e) {
      e.preventDefault()
      if (isMenuActive.value) {
        e.stopPropagation()
        isMenuActive.value = false
      }
    }

    function onKeyPress (e) {
      if (props.multiple) return

      const KEYBOARD_LOOKUP_THRESHOLD = 1000
      const now = performance.now()
      if (now - keyboardLookupLastTime.value > KEYBOARD_LOOKUP_THRESHOLD) {
        keyboardLookupPrefix.value = ''
      }
      keyboardLookupPrefix.value += e.key.toLowerCase()
      keyboardLookupLastTime.value = now

      const index = allItems.value.findIndex(item => {
        const text = (getText(item) || '').toString()
        return text.toLowerCase().startsWith(keyboardLookupPrefix.value)
      })
      const item = allItems.value[index]
      if (index !== -1) {
        setValue(props.returnObject ? item : getValue(item))
        setTimeout(() => setMenuIndex(index))
      }
    }

    function onKeyDown (e) {
      const keyCode = e.keyCode

      if (!props.readonly && !isMenuActive.value && [
        keyCodes.enter,
        keyCodes.space,
        keyCodes.up,
        keyCodes.down
      ].includes(keyCode)) activateMenu()

      if (isMenuActive.value && menu.value && typeof menu.value.changeListIndex === 'function') {
        menu.value.changeListIndex(e)
      }

      if (keyCode === keyCodes.enter) return onEnterDown(e)
      if (keyCode === keyCodes.esc) return onEscDown(e)
      if (keyCode === keyCodes.tab) return onTabDown(e)
    }

    function onMouseUp (e) {
      if (proxy?.hasMouseDown) {
        const appendInner = proxy?.$refs?.['append-inner']

        if (
          isMenuActive.value &&
          appendInner &&
          (appendInner === e.target || appendInner.contains(e.target))
        ) {
          nextTick(() => { isMenuActive.value = !isMenuActive.value })
        } else if ((proxy?.isEnclosed || false) && !proxy?.isDisabled) {
          isMenuActive.value = true
        }
      }

      baseOnMouseUp && baseOnMouseUp(e)
    }

    function onScroll () {
      if (!isMenuActive.value) {
        requestAnimationFrame(() => {
          if (content.value) content.value.scrollTop = 0
        })
      } else {
        if (lastItem.value >= computedItems.value.length) return

        const el = content.value
        if (!el) return

        const showMoreItems = (
          el.scrollHeight - (el.scrollTop + el.clientHeight)
        ) < 200

        if (showMoreItems) {
          lastItem.value += 20
        }
      }
    }

    function onTabDown (e) {
      const menuIndex = getMenuIndex()
      const listTile = menu.value && menu.value.tiles ? menu.value.tiles[menuIndex] : undefined

      if (
        listTile &&
        listTile.className.indexOf('v-list__tile--highlighted') > -1 &&
        isMenuActive.value &&
        menuIndex > -1
      ) {
        e.preventDefault()
        e.stopPropagation()

        listTile.click()
      } else {
        blur(e)
      }
    }

    function setMenuIndex (index) {
      if (menu.value) menu.value.listIndex = index
    }

    function setSelectedItems () {
      const selected = []
      const values = !props.multiple || !Array.isArray(proxy?.internalValue)
        ? [proxy?.internalValue]
        : proxy?.internalValue

      for (const value of values) {
        const index = allItems.value.findIndex(v => valueComparator(
          getValue(v),
          getValue(value)
        ))

        if (index > -1) selected.push(allItems.value[index])
      }

      selectedItems.value = selected
    }

    function setValue (value) {
      const oldValue = proxy?.internalValue
      if (proxy) proxy.internalValue = value
      if (value !== oldValue) emit('change', value)
    }

    watch(() => props.value, val => {
      lazyValue.value = val !== undefined
        ? val
        : (props.multiple ? [] : undefined)
    })

    watch(() => proxy?.internalValue, val => {
      if (proxy) proxy.initialValue = val
      setSelectedItems()
    })

    watch(isBooted, val => {
      if (!val) return
      nextTick(() => {
        if (content.value && content.value.addEventListener) {
          content.value.addEventListener('scroll', onScroll, false)
        }
      })
    })

    watch(isMenuActive, val => {
      if (val) isBooted.value = true
    })

    watch(() => props.items, val => {
      if (props.cacheItems) {
        cachedItems.value = filterDuplicates(cachedItems.value.concat(val))
      }

      setSelectedItems()
    }, { immediate: true })

    watch(menu, val => {
      content.value = val && val.$refs ? val.$refs.content : null
    })

    watch(content, (val, oldVal) => {
      if (oldVal && oldVal.removeEventListener) {
        oldVal.removeEventListener('scroll', onScroll, false)
      }

      if (val && isBooted.value && val.addEventListener) {
        val.addEventListener('scroll', onScroll, false)
      }
    })

    onMounted(() => {
      content.value = menu.value && menu.value.$refs ? menu.value.$refs.content : null

      if (isBooted.value && content.value && content.value.addEventListener) {
        content.value.addEventListener('scroll', onScroll, false)
      }
    })

    onBeforeUnmount(() => {
      if (content.value && content.value.removeEventListener) {
        content.value.removeEventListener('scroll', onScroll, false)
      }
    })

    expose({
      blur,
      focus,
      activateMenu,
      genChipSelection,
      genCommaSelection,
      genSelections,
      selectItem,
      setValue
    })

    return {
      setTextColor,
      valueComparator,
      noDataText,
      attrsInput,
      cachedItems,
      content,
      isBooted,
      isMenuActive,
      lastItem,
      lazyValue,
      menu,
      selectedIndex,
      selectedItems,
      keyboardLookupPrefix,
      keyboardLookupLastTime,
      allItems,
      classes,
      computedItems,
      counterValue,
      directives,
      dynamicHeight,
      hasChips,
      hasSlot,
      isDirty,
      listData,
      staticList,
      virtualizedItems,
      menuCanShow,
      $_menuProps: menuProps,
      blur,
      focus,
      activateMenu,
      clearableCallback,
      closeConditional,
      filterDuplicates,
      findExistingIndex,
      genChipSelection,
      genCommaSelection,
      genDefaultSlot,
      genInput,
      genList,
      genListWithSlot,
      genMenu,
      genSelections,
      genSlotSelection,
      getMenuIndex,
      getDisabled,
      getText,
      getValue,
      onBlur,
      onChipInput,
      onClick,
      onEnterDown,
      onEscDown,
      onKeyPress,
      onKeyDown,
      onMouseUp,
      onScroll,
      onTabDown,
      selectItem,
      setMenuIndex,
      setSelectedItems,
      setValue
    }
  }
})

export function useSelectController () {
  const instance = getCurrentInstance()
  const proxy = instance && instance.proxy

  if (!proxy) {
    throw new Error('[Vuetify] useSelectController must be called from within setup()')
  }

  const call = method => (...args) => {
    const target = proxy[method]
    return typeof target === 'function' ? target.apply(proxy, args) : undefined
  }

  const createComputed = getter => computed(() => getter(proxy))

  return {
    classes: createComputed(vm => vm.classes),
    hasSlot: createComputed(vm => Boolean(vm.hasSlot)),
    isAnyValueAllowed: createComputed(vm => vm.isAnyValueAllowed ?? false),
    menuProps: createComputed(vm => vm.$_menuProps),
    genSelections: call('genSelections'),
    genCommaSelection: call('genCommaSelection'),
    genChipSelection: call('genChipSelection'),
    genInput: call('genInput'),
    genLabel: call('genLabel'),
    onChipInput: call('onChipInput'),
    onEnterDown: call('onEnterDown'),
    onKeyDown: call('onKeyDown'),
    onTabDown: call('onTabDown'),
    selectItem: call('selectItem'),
    setValue: call('setValue')
  }
}
