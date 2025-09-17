// Components
import { VExpandTransition } from '../transitions'
import { VIcon } from '../VIcon'

// Composables
import useRegistrableInject from '../../composables/useRegistrableInject'

// Utils
import { getObjectValueByPath } from '../../util/helpers'
import { defineComponent, h, ref, computed, getCurrentInstance, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { PropType, Slot } from 'vue'

export const VTreeviewNodeProps = {
  activatable: Boolean,
  activeClass: {
    type: String,
    default: 'v-treeview-node--active'
  },
  selectable: Boolean,
  selectedColor: {
    type: String,
    default: 'accent'
  },
  indeterminateIcon: {
    type: String,
    default: '$vuetify.icons.checkboxIndeterminate'
  },
  onIcon: {
    type: String,
    default: '$vuetify.icons.checkboxOn'
  },
  offIcon: {
    type: String,
    default: '$vuetify.icons.checkboxOff'
  },
  expandIcon: {
    type: String,
    default: '$vuetify.icons.subgroup'
  },
  loadingIcon: {
    type: String,
    default: '$vuetify.icons.loading'
  },
  itemKey: {
    type: String,
    default: 'id'
  },
  itemText: {
    type: String,
    default: 'name'
  },
  itemChildren: {
    type: String,
    default: 'children'
  },
  loadChildren: Function as PropType<(item: any) => Promise<void>>,
  openOnClick: Boolean,
  transition: Boolean
}

export type TreeviewProvide = {
  register: (node: VTreeviewNodeInstance) => void
  unregister: (node: VTreeviewNodeInstance) => void
  updateOpen: (key: string | number, value: boolean) => void
  emitOpen: () => void
  updateSelected: (key: string | number, value: boolean) => void
  emitSelected: () => void
  updateActive: (key: string | number, value: boolean) => void
  emitActive: () => void
  isExcluded: (key: string | number) => boolean
}

const VTreeviewNode = defineComponent({
  name: 'v-treeview-node',

  props: {
    item: {
      type: Object as PropType<any>,
      default: () => null
    },
    ...VTreeviewNodeProps
  },

  setup (props, { slots, expose }) {
    const treeview = useRegistrableInject('treeview', 'v-treeview-node', 'v-treeview') as TreeviewProvide | null
    const vm = getCurrentInstance()

    const isOpen = ref(false)
    const isSelected = ref(false)
    const isIndeterminate = ref(false)
    const isActive = ref(false)
    const isLoading = ref(false)
    const hasLoaded = ref(false)

    const key = computed(() => getObjectValueByPath(props.item, props.itemKey))
    const children = computed<any[] | null>(() => getObjectValueByPath(props.item, props.itemChildren))
    const text = computed(() => getObjectValueByPath(props.item, props.itemText))

    const scopedProps = computed(() => ({
      item: props.item,
      leaf: !children.value,
      selected: isSelected.value,
      indeterminate: isIndeterminate.value,
      active: isActive.value,
      open: isOpen.value
    }))

    const computedIcon = computed(() => {
      if (isIndeterminate.value) return props.indeterminateIcon
      if (isSelected.value) return props.onIcon
      return props.offIcon
    })

    const hasChildren = computed(() => {
      return !!children.value && (!!children.value.length || !!props.loadChildren)
    })

    function checkChildren (): Promise<void> {
      return new Promise(resolve => {
        if (!children.value || children.value.length || !props.loadChildren || hasLoaded.value) {
          resolve()
          return
        }

        isLoading.value = true
        resolve(props.loadChildren(props.item))
      }).then(() => {
        isLoading.value = false
        hasLoaded.value = true
      })
    }

    function open () {
      isOpen.value = !isOpen.value
      treeview && treeview.updateOpen(key.value, isOpen.value)
      treeview && treeview.emitOpen()
    }

    function genLabel () {
      const content = []
      if (slots.label) content.push(slots.label(scopedProps.value))
      else content.push(text.value)

      return h('div', {
        slot: 'label',
        staticClass: 'v-treeview-node__label'
      }, content)
    }

    function genContent () {
      const content = [
        slots.prepend && slots.prepend(scopedProps.value),
        genLabel(),
        slots.append && slots.append(scopedProps.value)
      ]

      return h('div', {
        staticClass: 'v-treeview-node__content'
      }, content)
    }

    function genToggle () {
      return h(VIcon, {
        staticClass: 'v-treeview-node__toggle',
        class: {
          'v-treeview-node__toggle--open': isOpen.value,
          'v-treeview-node__toggle--loading': isLoading.value
        },
        slot: 'prepend',
        on: {
          click: (e: MouseEvent) => {
            e.stopPropagation()
            if (isLoading.value) return
            checkChildren().then(() => open())
          }
        }
      }, [isLoading.value ? props.loadingIcon : props.expandIcon])
    }

    function genCheckbox () {
      return h(VIcon, {
        staticClass: 'v-treeview-node__checkbox',
        props: {
          color: isSelected.value ? props.selectedColor : undefined
        },
        on: {
          click: (e: MouseEvent) => {
            e.stopPropagation()
            if (isLoading.value) return
            checkChildren().then(() => {
              nextTick(() => {
                isSelected.value = !isSelected.value
                isIndeterminate.value = false
                treeview && treeview.updateSelected(key.value, isSelected.value)
                treeview && treeview.emitSelected()
              })
            })
          }
        }
      }, [computedIcon.value])
    }

    function genNode () {
      const childrenNodes = [genContent()]
      if (props.selectable) childrenNodes.unshift(genCheckbox())
      if (hasChildren.value) childrenNodes.unshift(genToggle())

      return h('div', {
        staticClass: 'v-treeview-node__root',
        class: {
          [props.activeClass]: isActive.value
        },
        on: {
          click: () => {
            if (props.openOnClick && children.value) {
              open()
            } else if (props.activatable) {
              isActive.value = !isActive.value
              treeview && treeview.updateActive(key.value, isActive.value)
              treeview && treeview.emitActive()
            }
          }
        }
      }, childrenNodes)
    }

    function genChild (item: any) {
      const nodeSlots: Record<string, Slot> = {}
      for (const key in slots) {
        if (key === 'default') continue
        const slot = slots[key]
        if (slot) nodeSlots[key] = slot
      }

      return h(VTreeviewNode, {
        key: getObjectValueByPath(item, props.itemKey),
        activatable: props.activatable,
        activeClass: props.activeClass,
        item,
        selectable: props.selectable,
        selectedColor: props.selectedColor,
        expandIcon: props.expandIcon,
        indeterminateIcon: props.indeterminateIcon,
        offIcon: props.offIcon,
        onIcon: props.onIcon,
        loadingIcon: props.loadingIcon,
        itemKey: props.itemKey,
        itemText: props.itemText,
        itemChildren: props.itemChildren,
        loadChildren: props.loadChildren,
        transition: props.transition,
        openOnClick: props.openOnClick
      }, nodeSlots)
    }

    function genChildrenWrapper () {
      if (!isOpen.value || !children.value) return null
      return h('div', {
        staticClass: 'v-treeview-node__children'
      }, children.value.map(genChild))
    }

    function genTransition () {
      return h(VExpandTransition, [genChildrenWrapper()])
    }

    onMounted(() => {
      if (treeview && vm?.proxy) {
        treeview.register(vm.proxy as VTreeviewNodeInstance)
      }
    })

    onBeforeUnmount(() => {
      if (treeview && vm?.proxy) {
        treeview.unregister(vm.proxy as VTreeviewNodeInstance)
      }
    })

    expose({
      isOpen,
      isSelected,
      isIndeterminate,
      isActive,
      isLoading,
      hasLoaded,
      key,
      children,
      text,
      scopedProps,
      computedIcon,
      hasChildren,
      checkChildren,
      open,
      genLabel,
      genContent,
      genToggle,
      genCheckbox,
      genNode,
      genChild,
      genChildrenWrapper,
      genTransition,
      treeview
    })

    return () => {
      const nodes = [genNode()]

      if (props.transition) nodes.push(genTransition())
      else nodes.push(genChildrenWrapper())

      return h('div', {
        staticClass: 'v-treeview-node',
        class: {
          'v-treeview-node--leaf': !hasChildren.value,
          'v-treeview-node--click': props.openOnClick,
          'v-treeview-node--selected': isSelected.value,
          'v-treeview-node--excluded': treeview && treeview.isExcluded(key.value)
        }
      }, nodes)
    }
  }
})

export type VTreeviewNodeInstance = InstanceType<typeof VTreeviewNode>

export default VTreeviewNode
