import { Transition, TransitionGroup, defineComponent, h, mergeProps } from 'vue'

import { createJavaScriptTransition } from '../../util/helpers'
import ExpandTransitionGenerator from './expand-transition'

function callEventHandlers (handlers, ...args) {
  if (!handlers) return
  if (Array.isArray(handlers)) {
    handlers.forEach(handler => {
      if (typeof handler === 'function') handler(...args)
    })
    return
  }
  if (typeof handlers === 'function') {
    handlers(...args)
  }
}

function createCssTransition (name, origin = 'top center 0', defaultMode) {
  return defineComponent({
    name,

    props: {
      group: Boolean,
      hideOnLeave: Boolean,
      leaveAbsolute: Boolean,
      mode: {
        type: String,
        default: defaultMode
      },
      origin: {
        type: String,
        default: origin
      }
    },

    setup (props, { slots, attrs }) {
      return () => {
        const { onBeforeEnter, onLeave, ...restAttrs } = attrs
        const transitionProps = mergeProps(restAttrs, {
          name,
          mode: props.mode,
          onBeforeEnter: el => {
            el.style.transformOrigin = props.origin
            el.style.webkitTransformOrigin = props.origin
            callEventHandlers(onBeforeEnter, el)
          },
          onLeave: (...args) => {
            const el = args[0]
            if (props.leaveAbsolute && el) el.style.position = 'absolute'
            if (props.hideOnLeave && el) el.style.display = 'none'
            callEventHandlers(onLeave, ...args)
          }
        })

        const children = slots.default?.() ?? []
        const component = props.group ? TransitionGroup : Transition

        return h(component, transitionProps, children)
      }
    }
  })
}

// Component specific transitions
export const VBottomSheetTransition = createCssTransition('bottom-sheet-transition')
export const VCarouselTransition = createCssTransition('carousel-transition')
export const VCarouselReverseTransition = createCssTransition('carousel-reverse-transition')
export const VTabTransition = createCssTransition('tab-transition')
export const VTabReverseTransition = createCssTransition('tab-reverse-transition')
export const VMenuTransition = createCssTransition('menu-transition')
export const VFabTransition = createCssTransition('fab-transition', 'center center', 'out-in')

// Generic transitions
export const VDialogTransition = createCssTransition('dialog-transition')
export const VDialogBottomTransition = createCssTransition('dialog-bottom-transition')
export const VFadeTransition = createCssTransition('fade-transition')
export const VScaleTransition = createCssTransition('scale-transition')
export const VScrollXTransition = createCssTransition('scroll-x-transition')
export const VScrollXReverseTransition = createCssTransition('scroll-x-reverse-transition')
export const VScrollYTransition = createCssTransition('scroll-y-transition')
export const VScrollYReverseTransition = createCssTransition('scroll-y-reverse-transition')
export const VSlideXTransition = createCssTransition('slide-x-transition')
export const VSlideXReverseTransition = createCssTransition('slide-x-reverse-transition')
export const VSlideYTransition = createCssTransition('slide-y-transition')
export const VSlideYReverseTransition = createCssTransition('slide-y-reverse-transition')

// JavaScript transitions
export const VExpandTransition = createJavaScriptTransition('expand-transition', ExpandTransitionGenerator())
export const VExpandXTransition = createJavaScriptTransition('expand-x-transition', ExpandTransitionGenerator('', true))
export const VRowExpandTransition = createJavaScriptTransition('row-expand-transition', ExpandTransitionGenerator('datatable__expand-col--expanded'))

export default {
  $_vuetify_subcomponents: {
    VBottomSheetTransition,
    VCarouselTransition,
    VCarouselReverseTransition,
    VDialogTransition,
    VDialogBottomTransition,
    VFabTransition,
    VFadeTransition,
    VMenuTransition,
    VScaleTransition,
    VScrollXTransition,
    VScrollXReverseTransition,
    VScrollYTransition,
    VScrollYReverseTransition,
    VSlideXTransition,
    VSlideXReverseTransition,
    VSlideYTransition,
    VSlideYReverseTransition,
    VTabReverseTransition,
    VTabTransition,
    VExpandTransition,
    VExpandXTransition,
    VRowExpandTransition
  }
}
