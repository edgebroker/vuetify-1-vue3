// Components
import VIcon from '../VIcon'

// Composables
import useBootable from '../../composables/useBootable'
import useToggleable from '../../composables/useToggleable'
import useRegistrableInject from '../../composables/useRegistrableInject'

// Transitions
import { VExpandTransition } from '../transitions'

// Utils
import { defineComponent, h, computed, inject, getCurrentInstance, onMounted, onBeforeUnmount, watch } from 'vue'

export default defineComponent({
  name: 'v-list-group',

  props: {
    activeClass: {
      type: String,
      default: 'primary--text'
    },
    appendIcon: {
      type: String,
      default: '$vuetify.icons.expand'
    },
    disabled: Boolean,
    group: String,
    noAction: Boolean,
    prependIcon: String,
    subGroup: Boolean,
    lazy: Boolean,
    value: null
  },

  emits: ['input', 'click'],

  setup (props, { slots, emit, expose }) {
    const { isActive } = useToggleable(props, emit)
    const { showLazyContent } = useBootable(props, { isActive })
    const list = useRegistrableInject('list', 'v-list-group', 'v-list')
    const listClick = inject('listClick') as any
    const vm = getCurrentInstance()

    onMounted(() => {
      list && list.register && vm && list.register(vm.proxy)
      if (props.group && vm?.proxy.$route && props.value == null) {
        isActive.value = matchRoute(vm.proxy.$route.path)
      }
    })

    onBeforeUnmount(() => {
      list && list.unregister && vm && list.unregister(vm.proxy)
    })

    watch(isActive, val => {
      if (!props.subGroup && val) {
        listClick && listClick(vm?.uid)
      }
    })

    watch(() => vm?.proxy.$route, to => {
      if (!to) return
      const isMatch = matchRoute(to.path)
      if (props.group) {
        if (isMatch && isActive.value !== isMatch) {
          listClick && listClick(vm?.uid)
        }
        isActive.value = isMatch
      }
    })

    const groupClasses = computed(() => ({
      'v-list__group--active': isActive.value,
      'v-list__group--disabled': props.disabled
    }))

    const headerClasses = computed(() => ({
      'v-list__group__header--active': isActive.value,
      'v-list__group__header--sub-group': props.subGroup
    }))

    const itemsClasses = computed(() => ({
      'v-list__group__items--no-action': props.noAction
    }))

    function click (e: Event) {
      if (props.disabled) return
      emit('click', e)
      isActive.value = !isActive.value
    }

    function genIcon (icon: any) {
      return h(VIcon, [icon])
    }

    function genAppendIcon () {
      const icon = !props.subGroup ? props.appendIcon : false
      if (!icon && !slots.appendIcon) return null
      return h('div', { class: 'v-list__group__header__append-icon' }, [
        slots.appendIcon?.() || genIcon(icon)
      ])
    }

    function genPrependIcon () {
      const icon = props.prependIcon ? props.prependIcon : props.subGroup ? '$vuetify.icons.subgroup' : false
      if (!icon && !slots.prependIcon) return null
      return h('div', {
        class: {
          'v-list__group__header__prepend-icon': true,
          [props.activeClass]: isActive.value
        }
      }, [slots.prependIcon?.() || genIcon(icon)])
    }

    function genGroup () {
      return h('div', {
        class: ['v-list__group__header', headerClasses.value],
        onClick: click,
        ref: 'item'
      }, [
        genPrependIcon(),
        slots.activator?.(),
        genAppendIcon()
      ])
    }

    function genItems () {
      return h('div', {
        class: ['v-list__group__items', itemsClasses.value],
        style: { display: isActive.value ? '' : 'none' },
        ref: 'group'
      }, showLazyContent(slots.default?.()))
    }

    function toggle (uid: number) {
      isActive.value = vm?.uid === uid
    }

    function matchRoute (to: string) {
      if (!props.group) return false
      return to.match(props.group) !== null
    }

    expose({ toggle })

    return () => h('div', { class: ['v-list__group', groupClasses.value] }, [
      genGroup(),
      h(VExpandTransition, [genItems()])
    ])
  }
})
