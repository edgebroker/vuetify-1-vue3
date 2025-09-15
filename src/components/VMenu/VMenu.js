import "@/css/vuetify.css"

import { defineComponent, h, ref } from 'vue'

// Composables
import useBootable from '../../composables/useBootable'
import useDelayable from '../../composables/useDelayable'
import useDetachable, { detachableProps } from '../../composables/useDetachable'
import useMenuable, { menuableProps } from '../../composables/useMenuable'
import useReturnable, { returnableProps } from '../../composables/useReturnable'
import useThemeable, { themeProps } from '../../composables/useThemeable'
import useToggleable from '../../composables/useToggleable'

// Directives
import ClickOutside from '../../directives/click-outside'
import Resize from '../../directives/resize'

// Helpers
import { convertToUnit } from '../../util/helpers'
import ThemeProvider from '../../util/ThemeProvider'

export default defineComponent({
  name: 'v-menu',

  directives: {
    ClickOutside,
    Resize
  },

  props: {
    auto: Boolean,
    closeOnClick: {
      type: Boolean,
      default: true
    },
    closeOnContentClick: {
      type: Boolean,
      default: true
    },
    disabled: Boolean,
    fullWidth: Boolean,
    maxHeight: { default: 'auto' },
    openOnClick: {
      type: Boolean,
      default: true
    },
    offsetX: Boolean,
    offsetY: Boolean,
    openOnHover: Boolean,
    openDelay: {
      type: [Number, String],
      default: 0
    },
    closeDelay: {
      type: [Number, String],
      default: 0
    },
    origin: {
      type: String,
      default: 'top left'
    },
    transition: {
      type: [Boolean, String],
      default: 'v-menu-transition'
    },
    ...detachableProps,
    ...menuableProps,
    ...returnableProps,
    ...themeProps
  },

  setup (props, { slots, emit }) {
    const activatorRef = ref()
    const contentRef = ref()

    const { runDelay, clearDelay } = useDelayable(props)
    const { isActive } = useToggleable(props, emit)
    const menuable = useMenuable(props, { activator: activatorRef, content: contentRef, isActive })
    const detachable = useDetachable(props, { activator: activatorRef, content: contentRef, isActive })
    const { save } = useReturnable(props, { isActive, emit })
    const { themeClasses, rootThemeClasses } = useThemeable(props)
    const { showLazyContent } = useBootable(props, { isActive })

    function activate () {
      if (props.disabled) return
      runDelay('open', () => {
        isActive.value = true
        menuable.updateDimensions()
      })
    }

    function deactivate () {
      runDelay('close', () => {
        isActive.value = false
      })
    }

    function onResize () {
      if (isActive.value) menuable.updateDimensions()
    }

    return {
      activatorRef,
      contentRef,
      runDelay,
      clearDelay,
      isActive,
      ...menuable,
      ...detachable,
      save,
      themeClasses,
      rootThemeClasses,
      showLazyContent,
      activate,
      deactivate,
      onResize,
      slots,
      emit
    }
  },

  render () {
    const activator = this.$slots.activator ? h('div', {
      ref: 'activatorRef',
      class: {
        'v-menu__activator': true,
        'v-menu__activator--active': this.isActive,
        'v-menu__activator--disabled': this.disabled
      },
      on: this.openOnClick ? { click: this.activate } : undefined
    }, this.$slots.activator()) : null

    const styles = {
      maxHeight: this.auto ? '200px' : convertToUnit(this.maxHeight),
      minWidth: this.minWidth !== undefined ? convertToUnit(this.minWidth) : `${this.dimensions.activator.width}px`,
      maxWidth: convertToUnit(this.maxWidth),
      top: this.calcTop(),
      left: this.calcLeft(this.dimensions.content.width),
      transformOrigin: this.origin,
      zIndex: this.zIndex
    }

    const content = h('div', {
      ref: 'contentRef',
      class: ['v-menu__content', this.rootThemeClasses, {
        'v-menu__content--auto': this.auto,
        'v-menu__content--fixed': this.activatorFixed,
        'menuable__content__active': this.isActive,
        [this.contentClass.trim()]: true
      }],
      style: styles,
      directives: [
        { name: 'click-outside', value: this.deactivate },
        { name: 'show', value: this.isContentActive }
      ],
      on: {
        click: e => {
          e.stopPropagation()
          if (e.target.getAttribute('disabled')) return
          if (this.closeOnContentClick) this.deactivate()
        }
      }
    }, this.showLazyContent(this.$slots.default))

    const transition = this.transition
      ? h('transition', { props: { name: this.transition } }, [content])
      : content

    return h('div', {
      class: { 'v-menu--inline': !this.fullWidth && !!this.$slots.activator },
      directives: [{ arg: 500, name: 'resize', value: this.onResize }]
    }, [
      activator,
      h(ThemeProvider, { props: { root: true, light: this.light, dark: this.dark } }, [transition])
    ])
  }
})

