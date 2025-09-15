// Styles
import '@/css/vuetify.css'

// Components
import VTreeviewNode, { VTreeviewNodeProps } from './VTreeviewNode'

// Composables
import useRegistrableProvide from '../../composables/useRegistrableProvide'
import useThemeable, { themeProps } from '../../composables/useThemeable'

// Utils
import { arrayDiff, deepEqual, getObjectValueByPath } from '../../util/helpers'
import { consoleWarn } from '../../util/console'
import { filterTreeItems, FilterTreeItemFunction, filterTreeItem } from './util/filterTreeItems'

// Types
import { defineComponent, h, reactive, ref, computed, watch, provide, getCurrentInstance, onMounted } from 'vue'
import { PropType } from 'vue'

import type { VTreeviewNodeInstance } from './VTreeviewNode'

type NodeCache = Set<string | number>

type NodeState = {
  parent: string | number | null
  children: Array<string | number>
  vnode: VTreeviewNodeInstance | null
  isActive: boolean
  isSelected: boolean
  isIndeterminate: boolean
  isOpen: boolean
  item: any
}

function createNodeState (): NodeState {
  return {
    parent: null,
    children: [],
    vnode: null,
    isActive: false,
    isSelected: false,
    isIndeterminate: false,
    isOpen: false,
    item: null
  }
}

export default defineComponent({
  name: 'v-treeview',

  props: {
    active: {
      type: Array as PropType<Array<string | number | any>>,
      default: () => []
    },
    items: {
      type: Array as PropType<any[]>,
      default: () => []
    },
    hoverable: Boolean,
    multipleActive: Boolean,
    open: {
      type: Array as PropType<Array<string | number | any>>,
      default: () => []
    },
    openAll: Boolean,
    returnObject: {
      type: Boolean,
      default: false
    },
    value: {
      type: Array as PropType<Array<string | number | any>>,
      default: () => []
    },
    search: String,
    filter: Function as PropType<FilterTreeItemFunction>,
    ...VTreeviewNodeProps,
    ...themeProps
  },

  setup (props, { emit, slots }) {
    const vm = getCurrentInstance()
    const nodes = reactive<Record<string | number, NodeState>>({})
    const selectedCache = ref<NodeCache>(new Set())
    const activeCache = ref<NodeCache>(new Set())
    const openCache = ref<NodeCache>(new Set())

    const { register: baseRegister, unregister: baseUnregister } = useRegistrableProvide('treeview')
    const { themeClasses } = useThemeable(props)

    const excludedItems = computed(() => {
      const excluded = new Set<string | number>()

      if (!props.search) return excluded

      for (let i = 0; i < props.items.length; i++) {
        filterTreeItems(
          props.filter || filterTreeItem,
          props.items[i],
          props.search,
          props.itemKey,
          props.itemText,
          props.itemChildren,
          excluded
        )
      }

      return excluded
    })

    function emitNodeCache (event: string, cache: NodeCache) {
      const value = props.returnObject
        ? Array.from(cache).map(key => nodes[key].item)
        : Array.from(cache)

      emit(event, value)
    }

    function emitOpen () {
      emitNodeCache('update:open', openCache.value)
    }

    function emitSelected () {
      emitNodeCache('input', selectedCache.value)
    }

    function emitActive () {
      emitNodeCache('update:active', activeCache.value)
    }

    function updateVnodeState (key: string | number) {
      const node = nodes[key]
      if (node && node.vnode) {
        node.vnode.isSelected = node.isSelected
        node.vnode.isIndeterminate = node.isIndeterminate
        node.vnode.isActive = node.isActive
        node.vnode.isOpen = node.isOpen
      }
    }

    function calculateState (node: NodeState) {
      const counts = node.children.reduce((acc, child) => {
        const state = nodes[child]
        if (!state) return acc
        acc[0] += Number(Boolean(state.isSelected))
        acc[1] += Number(Boolean(state.isIndeterminate))
        return acc
      }, [0, 0])

      node.isSelected = !!node.children.length && counts[0] === node.children.length
      node.isIndeterminate = !node.isSelected && (counts[0] > 0 || counts[1] > 0)

      return node
    }

    function getKeys (items: any[], keys: Array<string | number> = []) {
      for (let i = 0; i < items.length; i++) {
        const key = getObjectValueByPath(items[i], props.itemKey)
        keys.push(key)
        const children = getObjectValueByPath(items[i], props.itemChildren)
        if (children) keys.push(...getKeys(children))
      }
      return keys
    }

    function buildTree (items: any[], parent: string | number | null = null) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const key = getObjectValueByPath(item, props.itemKey)
        const children = getObjectValueByPath(item, props.itemChildren, [])
        const oldNode = nodes.hasOwnProperty(key) ? nodes[key] : createNodeState()

        const node: NodeState = {
          parent,
          children: children.map((c: any) => getObjectValueByPath(c, props.itemKey)),
          vnode: oldNode.vnode,
          isActive: oldNode.isActive,
          isSelected: oldNode.isSelected,
          isIndeterminate: oldNode.isIndeterminate,
          isOpen: oldNode.isOpen,
          item
        }

        if (!nodes.hasOwnProperty(key) && parent !== null && nodes.hasOwnProperty(parent)) {
          node.isSelected = nodes[parent].isSelected
          node.isIndeterminate = nodes[parent].isIndeterminate
        }

        nodes[key] = children.length ? calculateState(node) : node

        if (nodes[key].isSelected) selectedCache.value.add(key)
        if (nodes[key].isActive) activeCache.value.add(key)
        if (nodes[key].isOpen) openCache.value.add(key)

        updateVnodeState(key)

        buildTree(children, key)
      }
    }

    function getDescendants (key: string | number, descendants: Array<string | number> = []) {
      const node = nodes[key]
      if (!node) return descendants

      descendants.push(...node.children)

      for (let i = 0; i < node.children.length; i++) {
        descendants = getDescendants(node.children[i], descendants)
      }

      return descendants
    }

    function getParents (key: string | number) {
      let parent = nodes[key] && nodes[key].parent
      const parents: Array<string | number> = []

      while (parent !== null && parent !== undefined) {
        parents.push(parent)
        parent = nodes[parent] && nodes[parent].parent
      }

      return parents
    }

    function updateActive (key: string | number, isActiveNode: boolean) {
      if (!nodes.hasOwnProperty(key)) return

      if (!props.multipleActive) {
        activeCache.value.forEach(activeKey => {
          const node = nodes[activeKey]
          if (!node) return
          node.isActive = false
          updateVnodeState(activeKey)
        })
        activeCache.value.clear()
      }

      const node = nodes[key]
      if (!node) return

      if (isActiveNode) activeCache.value.add(key)
      else activeCache.value.delete(key)

      node.isActive = isActiveNode
      updateVnodeState(key)
    }

    function updateSelected (key: string | number, isSelectedNode: boolean) {
      if (!nodes.hasOwnProperty(key)) return

      const changed = new Map<string | number, boolean>()

      const descendants = [key, ...getDescendants(key)]
      descendants.forEach(descendant => {
        const node = nodes[descendant]
        if (!node) return
        node.isSelected = isSelectedNode
        node.isIndeterminate = false
        changed.set(descendant, isSelectedNode)
      })

      const parents = getParents(key)
      parents.forEach(parent => {
        const node = nodes[parent]
        if (!node) return
        nodes[parent] = calculateState(node)
        changed.set(parent, nodes[parent].isSelected)
      })

      const all = new Set([key, ...descendants, ...parents])
      all.forEach(updateVnodeState)

      for (const [entryKey, value] of changed.entries()) {
        if (value) selectedCache.value.add(entryKey)
        else selectedCache.value.delete(entryKey)
      }
    }

    function updateOpen (key: string | number, isOpen: boolean) {
      if (!nodes.hasOwnProperty(key)) return

      const node = nodes[key]
      const children = getObjectValueByPath(node.item, props.itemChildren)

      if (children && !children.length && node.vnode && !node.vnode.hasLoaded) {
        node.vnode.checkChildren().then(() => updateOpen(key, isOpen))
      } else if (children && children.length) {
        node.isOpen = isOpen
        if (isOpen) openCache.value.add(key)
        else openCache.value.delete(key)
        updateVnodeState(key)
      }
    }

    function handleNodeCacheWatcher (value: any[], cache: typeof selectedCache | typeof activeCache | typeof openCache, updateFn: (key: string | number, value: boolean) => void, emitFn: () => void) {
      const val = props.returnObject
        ? value.map(v => getObjectValueByPath(v, props.itemKey))
        : value

      const old = Array.from(cache.value)
      if (deepEqual(old, val)) return

      old.forEach(key => updateFn(key, false))
      val.forEach(key => updateFn(key, true))

      emitFn()
    }

    function updateAll (value: boolean) {
      Object.keys(nodes).forEach(key => {
        const node = nodes[key]
        if (!node) return
        const itemKey = getObjectValueByPath(node.item, props.itemKey)
        updateOpen(itemKey, value)
      })
      emitOpen()
    }

    function register (node: VTreeviewNodeInstance) {
      baseRegister(node)
      const key = getObjectValueByPath(node.item, props.itemKey)
      if (!nodes[key]) nodes[key] = createNodeState()
      nodes[key].vnode = node
      updateVnodeState(key)
    }

    function unregister (node: VTreeviewNodeInstance) {
      baseUnregister(node)
      const key = getObjectValueByPath(node.item, props.itemKey)
      if (nodes[key]) nodes[key].vnode = null
    }

    function isExcluded (key: string | number) {
      return !!props.search && excludedItems.value.has(key)
    }

    provide('treeview', {
      register,
      unregister,
      updateOpen,
      emitOpen,
      updateSelected,
      emitSelected,
      updateActive,
      emitActive,
      isExcluded
    })

    watch(() => props.items, (newVal, oldVal) => {
      const oldKeys = Object.keys(nodes).map(k => getObjectValueByPath(nodes[k].item, props.itemKey))
      const newKeys = getKeys(newVal)
      const diff = arrayDiff(newKeys, oldKeys)

      if (!diff.length && newKeys.length < oldKeys.length) return

      diff.forEach(k => delete nodes[k])

      const oldSelected = Array.from(selectedCache.value)
      selectedCache.value = new Set()
      activeCache.value = new Set()
      openCache.value = new Set()
      buildTree(newVal)

      if (!deepEqual(oldSelected, Array.from(selectedCache.value))) emitSelected()
    }, { deep: true })

    watch(() => props.active, value => {
      handleNodeCacheWatcher(value || [], activeCache, updateActive, emitActive)
    })

    watch(() => props.value, value => {
      handleNodeCacheWatcher(value || [], selectedCache, updateSelected, emitSelected)
    })

    watch(() => props.open, value => {
      handleNodeCacheWatcher(value || [], openCache, updateOpen, emitOpen)
    })

    buildTree(props.items)
    props.value.forEach(key => updateSelected(key, true))
    emitSelected()
    props.active.forEach(key => updateActive(key, true))
    emitActive()

    onMounted(() => {
      if (vm?.proxy && (vm.proxy.$slots.prepend || vm.proxy.$slots.append)) {
        consoleWarn('The prepend and append slots require a slot-scope attribute', vm.proxy)
      }

      if (props.openAll) {
        updateAll(true)
      } else {
        props.open.forEach(key => updateOpen(key, true))
        emitOpen()
      }
    })

    return {
      nodes,
      selectedCache,
      activeCache,
      openCache,
      excludedItems,
      emitOpen,
      emitSelected,
      emitActive,
      updateAll,
      updateSelected,
      updateActive,
      updateOpen,
      isExcluded,
      themeClasses
    }
  },

  render () {
    const children = this.items.length
      ? this.items.map((item: any) => h(VTreeviewNode, {
        key: getObjectValueByPath(item, this.itemKey),
        props: {
          activatable: this.activatable,
          activeClass: this.activeClass,
          item,
          selectable: this.selectable,
          selectedColor: this.selectedColor,
          expandIcon: this.expandIcon,
          indeterminateIcon: this.indeterminateIcon,
          offIcon: this.offIcon,
          onIcon: this.onIcon,
          loadingIcon: this.loadingIcon,
          itemKey: this.itemKey,
          itemText: this.itemText,
          itemChildren: this.itemChildren,
          loadChildren: this.loadChildren,
          transition: this.transition,
          openOnClick: this.openOnClick
        },
        scopedSlots: this.$scopedSlots
      }))
      : this.$slots.default

    return h('div', {
      staticClass: 'v-treeview',
      class: {
        'v-treeview--hoverable': this.hoverable,
        ...this.themeClasses
      }
    }, children)
  }
})
