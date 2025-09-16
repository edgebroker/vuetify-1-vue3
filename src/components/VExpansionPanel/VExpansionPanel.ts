import '@/css/vuetify.css'

import { VExpansionPanelContent } from '.'

// Composables
import useThemeable, { themeProps } from '../../composables/useThemeable'
import useRegistrableProvide from '../../composables/useRegistrableProvide'

// Types
import { defineComponent, h, ref, computed, watch, provide } from 'vue'
import { PropType } from 'vue'

export type VExpansionPanelContentInstance = InstanceType<typeof VExpansionPanelContent>

export default defineComponent({
  name: 'v-expansion-panel',

  props: {
    ...themeProps,
    disabled: Boolean,
    readonly: Boolean,
    expand: Boolean,
    focusable: Boolean,
    inset: Boolean,
    popout: Boolean,
    value: {
      type: [Number, Array] as PropType<number | number[]>,
      default: null
    }
  },

  setup (props, { slots, emit }) {
    const { themeClasses } = useThemeable(props)
    const { children: items, register: baseRegister, unregister: baseUnregister } = useRegistrableProvide('expansionPanel')
    const open = ref<boolean[]>([])

    function updatePanels (openArr: boolean[]) {
      open.value = openArr
      items.forEach((item, index) => {
        item && item.toggle(!!openArr[index])
      })
    }

    function updateFromValue (v: number | number[] | null) {
      if (Array.isArray(v) && !props.expand) return

      let newOpen = Array(items.length).fill(false) as boolean[]
      if (typeof v === 'number') {
        newOpen[v] = true
      } else if (v !== null) {
        newOpen = v as boolean[]
      }
      updatePanels(newOpen)
    }

    function panelClick (uid: number) {
      const newOpen = props.expand ? open.value.slice() : Array(items.length).fill(false)
      const index = items.findIndex(item => (item as any)._uid === uid)
      if (index === -1) return

      newOpen[index] = !open.value[index]
      if (!props.expand) emit('input', newOpen[index] ? index : null)

      updatePanels(newOpen)
      if (props.expand) emit('input', newOpen)
    }

    function register (content: VExpansionPanelContentInstance) {
      baseRegister(content)
      const i = items.indexOf(content)
      if (props.value !== null) updateFromValue(props.value as any)
      content.toggle(!!open.value[i])
    }

    function unregister (content: VExpansionPanelContentInstance) {
      const index = items.indexOf(content)
      baseUnregister(content)
      open.value.splice(index, 1)
    }

    provide('expansionPanel', {
      register,
      unregister,
      panelClick,
      get disabled () { return props.disabled },
      get readonly () { return props.readonly }
    })

    const classes = computed(() => ({
      'v-expansion-panel--focusable': props.focusable,
      'v-expansion-panel--popout': props.popout,
      'v-expansion-panel--inset': props.inset,
      ...themeClasses.value
    }))

    watch(() => props.expand, v => {
      let openIndex = -1
      if (!v) {
        const openCount = open.value.reduce((acc, val) => val ? acc + 1 : acc, 0)
        const newOpen = Array(items.length).fill(false)
        if (openCount === 1) {
          openIndex = open.value.indexOf(true)
        }
        if (openIndex > -1) {
          newOpen[openIndex] = true
        }
        open.value = newOpen
      }
      emit('input', v ? open.value : (openIndex > -1 ? openIndex : null))
    })

    watch(() => props.value, v => {
      updateFromValue(v as any)
    })

    return () => h('ul', {
      class: ['v-expansion-panel', classes.value]
    }, slots.default?.())
  }
})
