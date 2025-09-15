import { defineComponent, h, ref, computed, getCurrentInstance, onMounted, onBeforeUnmount, nextTick, withDirectives, vShow } from 'vue'

import { VExpandTransition } from '../transitions'
import VIcon from '../VIcon'
import Ripple from '../../directives/ripple'

import useBootable from '../../composables/useBootable'
import useToggleable from '../../composables/useToggleable'
import useRegistrableInject from '../../composables/useRegistrableInject'

import { consoleWarn } from '../../util/console'

export default defineComponent({
  name: 'v-expansion-panel-content',

  props: {
    disabled: Boolean,
    readonly: Boolean,
    expandIcon: {
      type: String,
      default: '$vuetify.icons.expand',
    },
    hideActions: Boolean,
    ripple: {
      type: [Boolean, Object],
      default: false,
    },
    value: null,
  },

  setup (props, { slots, emit, expose }) {
    const expansionPanel = useRegistrableInject('expansionPanel', 'v-expansion-panel-content', 'v-expansion-panel')
    const { isActive } = useToggleable(props, emit)
    const { isBooted, showLazyContent } = useBootable(props, { isActive })

    const height = ref('auto')

    const isDisabled = computed(() => (expansionPanel && expansionPanel.disabled) || props.disabled)
    const isReadonly = computed(() => (expansionPanel && expansionPanel.readonly) || props.readonly)

    const containerClasses = computed(() => ({
      'v-expansion-panel__container--active': isActive.value,
      'v-expansion-panel__container--disabled': isDisabled.value,
    }))

    const vm = getCurrentInstance()

    onMounted(() => {
      expansionPanel && expansionPanel.register && expansionPanel.register(vm?.proxy)
      if (typeof props.value !== 'undefined') consoleWarn('v-model has been deprecated', vm?.proxy)
    })

    onBeforeUnmount(() => {
      expansionPanel && expansionPanel.unregister && expansionPanel.unregister(vm?.proxy)
    })

    function onKeydown (e: KeyboardEvent) {
      if (e.keyCode === 13 && vm?.proxy && vm.proxy.$el === document.activeElement) {
        expansionPanel && expansionPanel.panelClick && expansionPanel.panelClick(vm.proxy._uid)
      }
    }

    function onHeaderClick () {
      if (!isReadonly.value) {
        expansionPanel && expansionPanel.panelClick && expansionPanel.panelClick(vm?.proxy._uid)
      }
    }

    function genBody () {
      const body = h('div', { ref: 'body', class: 'v-expansion-panel__body' }, showLazyContent(slots.default?.()))
      return withDirectives(body, [[vShow, isActive.value]])
    }

    function genIcon () {
      const icon = slots.actions?.() || [h(VIcon, {}, { default: () => props.expandIcon })]
      return h('transition', { name: 'fade-transition' }, [
        withDirectives(h('div', { class: 'v-expansion-panel__header__icon' }, icon), [[vShow, !isDisabled.value]])
      ])
    }

    function genHeader () {
      const children = slots.header ? [...slots.header()] : []
      if (!props.hideActions) children.push(genIcon())
      return withDirectives(h('div', {
        class: 'v-expansion-panel__header',
        onClick: onHeaderClick,
      }, children), [[Ripple, props.ripple]])
    }

    function toggle (active: boolean) {
      if (active) isBooted.value = true
      nextTick(() => { isActive.value = active })
    }

    expose({ toggle })

    return () => h('li', {
      class: ['v-expansion-panel__container', containerClasses.value],
      tabindex: isReadonly.value || isDisabled.value ? undefined : 0,
      'aria-expanded': String(Boolean(isActive.value)),
      onKeydown,
    }, [
      slots.header && genHeader(),
      h(VExpandTransition, {}, { default: () => [genBody()] }),
    ])
  }
})

