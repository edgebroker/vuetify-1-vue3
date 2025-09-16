import { getCurrentInstance, h } from 'vue'
import { getSlotType } from '../../../util/helpers'

export default function useMenuGenerators (props, {
  slots,
  attrs,
  activatorRef,
  activatorNode,
  contentRef,
  isActive,
  menuable,
  menuActivator,
  menuKeyable,
  showLazyContent,
  styles,
  rootThemeClasses,
  getScopeIdAttrs,
  closeConditional,
  dependent
}) {
  const vm = getCurrentInstance()

  function genActivator () {
    if (!slots.activator) return null

    const listeners = {}

    if (!props.disabled) {
      if (props.openOnHover) {
        listeners.mouseenter = menuActivator.mouseEnterHandler
        listeners.mouseleave = menuActivator.mouseLeaveHandler
      } else if (props.openOnClick) {
        listeners.click = menuActivator.activatorClickHandler
      }
    }

    if (!props.disableKeys) {
      listeners.keydown = menuKeyable.onKeyDown
    }

    const slotType = vm && vm.proxy ? getSlotType(vm.proxy, 'activator') : null

    if (slotType === 'scoped') {
      const activator = slots.activator({ on: listeners })
      activatorNode.value = activator
      return activator
    }

    return h('div', {
      staticClass: 'v-menu__activator',
      class: {
        'v-menu__activator--active': menuActivator.hasJustFocused.value || isActive.value,
        'v-menu__activator--disabled': props.disabled
      },
      ref: activatorRef,
      on: listeners
    }, slots.activator())
  }

  function genDirectives () {
    const directives = []

    if (!props.openOnHover && props.closeOnClick) {
      directives.push({
        name: 'click-outside',
        value: () => { isActive.value = false },
        args: {
          closeConditional,
          include: () => {
            const elements = []
            if (vm && vm.proxy && vm.proxy.$el) elements.push(vm.proxy.$el)
            return elements.concat(dependent.getOpenDependentElements())
          }
        }
      })
    }

    directives.push({
      name: 'show',
      value: menuable.isContentActive.value
    })

    return directives
  }

  function genContent () {
    const scopeIdAttrs = getScopeIdAttrs ? getScopeIdAttrs() : {}
    const role = 'role' in attrs ? attrs.role : 'menu'
    const contentClass = props.contentClass ? props.contentClass.trim() : ''

    const options = {
      attrs: {
        ...scopeIdAttrs,
        role
      },
      staticClass: 'v-menu__content',
      class: [
        rootThemeClasses.value,
        {
          'v-menu__content--auto': props.auto,
          'v-menu__content--fixed': menuable.activatorFixed.value,
          'menuable__content__active': isActive.value,
          [contentClass]: contentClass.length > 0
        }
      ],
      style: styles.value,
      directives: genDirectives(),
      ref: contentRef,
      on: {
        click: e => {
          e.stopPropagation()
          if (e.target && e.target.getAttribute && e.target.getAttribute('disabled')) return
          if (props.closeOnContentClick) isActive.value = false
        },
        keydown: menuKeyable.onKeyDown
      }
    }

    const listeners = options.on
    if (attrs && attrs.onScroll) listeners.scroll = attrs.onScroll

    if (!props.disabled && props.openOnHover) listeners.mouseenter = menuActivator.mouseEnterHandler
    if (props.openOnHover) listeners.mouseleave = menuActivator.mouseLeaveHandler

    return h('div', options, showLazyContent(slots.default ? slots.default() : undefined))
  }

  function genTransition () {
    const content = genContent()

    if (!props.transition) return content

    return h('transition', { props: { name: props.transition } }, [content])
  }

  return {
    genActivator,
    genDirectives,
    genContent,
    genTransition
  }
}
