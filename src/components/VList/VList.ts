import '@/css/vuetify.css'
import VListGroup from './VListGroup'

// Composables
import useThemeable, { themeProps } from '../../composables/useThemeable'
import useRegistrableProvide from '../../composables/useRegistrableProvide'

// Types
import { defineComponent, h, computed, provide } from 'vue'

type VListGroupInstance = InstanceType<typeof VListGroup>

export default defineComponent({
  name: 'v-list',

  props: {
    dense: Boolean,
    expand: Boolean,
    subheader: Boolean,
    threeLine: Boolean,
    twoLine: Boolean,
    ...themeProps
  },

  setup (props, { slots, expose }) {
    const { themeClasses } = useThemeable(props)
    const { children: groups } = useRegistrableProvide('list')

    function listClick (uid: number) {
      if (props.expand) return
      groups.forEach((group: VListGroupInstance) => {
        group.toggle(uid)
      })
    }

    provide('listClick', listClick)

    expose({
      listClick,
      groups,
    })

    const classes = computed(() => ({
      'v-list--dense': props.dense,
      'v-list--subheader': props.subheader,
      'v-list--two-line': props.twoLine,
      'v-list--three-line': props.threeLine,
      ...themeClasses.value
    }))

    return () => h('div', {
      class: ['v-list', classes.value],
      role: 'list'
    }, slots.default?.())
  }
})
