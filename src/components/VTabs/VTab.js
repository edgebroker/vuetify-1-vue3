// Composables
import useRoutable, { routableProps } from '../../composables/useRoutable'
import useThemeable, { themeProps } from '../../composables/useThemeable'
import { factory as useGroupableFactory } from '../../composables/useGroupable'

// Utils
import { defineComponent, h, computed, ref, getCurrentInstance, watch, nextTick, onMounted } from 'vue'

const useTabGroupable = useGroupableFactory('tabGroup', 'v-tab', 'v-tabs')

export default defineComponent({
  name: 'v-tab',

  props: {
    ...routableProps,
    ...themeProps,
    ripple: {
      type: [Boolean, Object],
      default: true,
    },
  },

  emits: ['change', 'click'],

  setup (props, { attrs, slots, emit, expose }) {
    const { generateRouteLink } = useRoutable(props, { attrs, emit })
    const { groupClasses, toggle, isActive, activeClass } = useTabGroupable(props, emit)
    const { themeClasses } = useThemeable(props)

    const linkRef = ref()
    const vm = getCurrentInstance()

    const classes = computed(() => ({
      'v-tabs__item': true,
      'v-tabs__item--disabled': props.disabled,
      ...groupClasses.value,
      ...themeClasses.value,
    }))

    const value = computed(() => {
      let to = props.to ?? props.href ?? ''

      if (vm?.proxy?.$router && props.to === Object(props.to)) {
        const resolve = vm.proxy.$router.resolve(
          props.to,
          vm.proxy.$route,
          props.append,
        )
        to = resolve.href
      }

      return to.toString().replace('#', '')
    })

    function onRouteChange () {
      if (!props.to || !linkRef.value) return

      nextTick(() => {
        const target = linkRef.value.$el ?? linkRef.value
        if (!target || !activeClass.value) return
        const classList = target.classList || target.$el?.classList
        if (classList && classList.contains(activeClass.value)) {
          toggle()
        }
      })
    }

    watch(() => vm?.proxy?.$route, () => onRouteChange())
    onMounted(() => onRouteChange())

    expose({ toggle, isActive, value })

    return () => {
      const link = generateRouteLink(classes.value)
      const { data } = link

      const originalClick = data.on?.click
      data.on = {
        ...data.on,
        click: (e) => {
          if (props.href && props.href.indexOf('#') > -1) e.preventDefault()
          originalClick && originalClick(e)
          if (!props.to) toggle()
        },
      }

      const tag = props.disabled ? 'div' : link.tag
      data.ref = linkRef

      return h('div', { class: 'v-tabs__div' }, [h(tag, data, slots.default?.())])
    }
  },
})
