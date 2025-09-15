import { computed, getCurrentInstance } from 'vue'
import Ripple from '../../packages/vuetify/src/directives/ripple'

const routableProps = {
  activeClass: String,
  append: Boolean,
  disabled: Boolean,
  exact: {
    type: Boolean,
    default: undefined
  },
  exactActiveClass: String,
  href: [String, Object],
  to: [String, Object],
  nuxt: Boolean,
  replace: Boolean,
  ripple: [Boolean, Object],
  tag: String,
  target: String,
}

export default function useRoutable (props, { attrs = {}, emit } = {}) {
  const computedRipple = computed(() => (props.ripple && !props.disabled) ? props.ripple : false)

  function click (e) {
    emit && emit('click', e)
  }

  function generateRouteLink (classes) {
    let exact = props.exact
    let tag

    const data = {
      attrs: { disabled: props.disabled },
      class: classes,
      props: {},
      directives: [{ name: 'ripple', value: computedRipple.value }],
      on: {
        ...('on' in attrs ? attrs.on : {}),
        click
      }
    }

    if (typeof props.exact === 'undefined') {
      exact = props.to === '/' ||
        (props.to && typeof props.to === 'object' && props.to.path === '/')
    }

    if (props.to) {
      let activeClass = props.activeClass
      let exactActiveClass = props.exactActiveClass || activeClass

      const instance = getCurrentInstance()
      const proxyClass = instance && instance.proxy && instance.proxy.proxyClass

      if (proxyClass) {
        activeClass += ' ' + proxyClass
        exactActiveClass += ' ' + proxyClass
      }

      tag = props.nuxt ? 'nuxt-link' : 'router-link'
      Object.assign(data.props, {
        to: props.to,
        exact,
        activeClass,
        exactActiveClass,
        append: props.append,
        replace: props.replace
      })
    } else {
      tag = (props.href && 'a') || props.tag || 'a'

      if (tag === 'a' && props.href) data.attrs.href = props.href
    }

    if (props.target) data.attrs.target = props.target

    return { tag, data }
  }

  return { Ripple, computedRipple, click, generateRouteLink }
}

export { routableProps }
