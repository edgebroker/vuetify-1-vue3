import '@/css/vuetify.css'

// Composables
import useDataIterable, { dataIterableProps } from '../../composables/useDataIterable'
import useThemeable, { themeProps } from '../../composables/useThemeable'

// Types
import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'v-data-iterator',

  inheritAttrs: false,

  props: {
    contentTag: {
      type: String,
      default: 'div'
    },
    contentProps: {
      type: Object,
      required: false
    },
    contentClass: {
      type: String,
      required: false
    },
    ...dataIterableProps,
    ...themeProps
  },

  setup (props, { attrs, slots, emit }) {
    const iterable = useDataIterable(props, emit)
    const { themeClasses } = useThemeable(props)

    iterable.initPagination()

    function classes () {
      return {
        'v-data-iterator': true,
        'v-data-iterator--select-all': props.selectAll !== false,
        ...themeClasses.value
      }
    }

    function genEmptyItems (content) {
      return [h('div', {
        class: 'text-xs-center',
        style: 'width: 100%'
      }, content)]
    }

    function genFilteredItems () {
      if (!slots.item) return null
      const items = []
      for (let index = 0, len = iterable.filteredItems.value.length; index < len; ++index) {
        const item = iterable.filteredItems.value[index]
        const propsOut = iterable.createProps(item, index)
        items.push(slots.item(propsOut))
      }
      return items
    }

    function genItems () {
      const items = genFilteredItems()
      if (items && items.length) return items
      return genEmptyItems(slots['no-results'] ? slots['no-results']() : props.noResultsText)
    }

    function genContent () {
      const children = genItems()
      const data = {
        class: props.contentClass,
        ...attrs,
        props: props.contentProps
      }
      return h(props.contentTag, data, children)
    }

    function genFooter () {
      const children = []
      if (slots.footer) children.push(slots.footer())
      if (!props.hideActions) children.push(iterable.genActions ? iterable.genActions() : null)
      return children.length ? h('div', children) : null
    }

    function genHeader () {
      const children = []
      if (slots.header) children.push(slots.header())
      return children.length ? h('div', children) : null
    }

    return () => h('div', { class: classes() }, [
      genHeader(),
      genContent(),
      genFooter()
    ])
  }
})

