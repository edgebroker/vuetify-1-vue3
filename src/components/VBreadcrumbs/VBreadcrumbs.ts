// Styles
import '@/css/vuetify.css'

// Types
import { defineComponent, h, computed, onMounted, PropType } from 'vue'

// Components
import { VBreadcrumbsDivider, VBreadcrumbsItem } from '.'

// Composables
import useThemeable, { themeProps } from '../../composables/useThemeable'

// Utils
import { deprecate } from '../../util/console'

export default defineComponent({
  name: 'v-breadcrumbs',

  props: {
    ...themeProps,
    divider: {
      type: String,
      default: '/'
    },
    items: {
      type: Array as PropType<any[]>,
      default: () => ([])
    },
    large: Boolean,
    justifyCenter: Boolean,
    justifyEnd: Boolean
  },

  setup (props, { slots }) {
    const { themeClasses } = useThemeable(props)

    const classes = computed(() => ({
      'v-breadcrumbs--large': props.large,
      'justify-center': props.justifyCenter,
      'justify-end': props.justifyEnd,
      ...themeClasses.value
    }))

    onMounted(() => {
      if (props.justifyCenter) deprecate('justify-center', 'class="justify-center"')
      if (props.justifyEnd) deprecate('justify-end', 'class="justify-end"')
      if (slots.default) deprecate('default slot', ':items and scoped slot "item"')
    })

    function genDivider () {
      return h(VBreadcrumbsDivider, {}, slots.divider?.() ?? props.divider)
    }

    function genChildren () {
      const children = []
      const slotNodes = slots.default?.() || []
      let createDividers = false

      for (const elm of slotNodes) {
        const type: any = elm.type
        if (!type || type.name !== 'v-breadcrumbs-item') {
          children.push(elm)
        } else {
          if (createDividers) children.push(genDivider())
          children.push(elm)
          createDividers = true
        }
      }

      return children
    }

    function genItems () {
      const items: any[] = []
      const hasSlot = !!slots.item
      const keys: string[] = []

      for (let i = 0; i < props.items.length; i++) {
        const item: any = props.items[i]
        keys.push(item.text)

        if (hasSlot) items.push(slots.item!({ item }))
        else items.push(h(VBreadcrumbsItem, { key: keys.join('.'), ...item }, { default: () => item.text }))

        if (i < props.items.length - 1) items.push(genDivider())
      }

      return items
    }

    return () => {
      const children = slots.default ? genChildren() : genItems()

      return h('ul', {
        class: ['v-breadcrumbs', classes.value]
      }, children)
    }
  }
})
