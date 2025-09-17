/* eslint-disable max-len */

export type Dictionary<T> = Record<string, T>

export interface TouchStoredHandlers {
  [event: string]: EventListenerOrEventListenerObject
}

declare global {
  interface Window {
    Vue?: import('vue').App<Element>
  }

  type Dictionary<T> = Record<string, T>

  interface HTMLCollection {
    [Symbol.iterator] (): IterableIterator<Element>
  }

  interface Element {
    getElementsByClassName(classNames: string): NodeListOf<HTMLElement>
  }

  interface HTMLElement {
    _clickOutside?: EventListenerOrEventListenerObject
    _onResize?: {
      callback: () => void
      options?: boolean | AddEventListenerOptions
    }
    _ripple?: {
      enabled?: boolean
      centered?: boolean
      class?: string
      circle?: boolean
      touched?: boolean
    }
    _onScroll?: {
      callback: EventListenerOrEventListenerObject
      options: boolean | AddEventListenerOptions
      target: EventTarget
    }
    _touchHandlers?: {
      [_uid: number]: TouchStoredHandlers
    }
  }

  interface WheelEvent {
    path?: EventTarget[]
  }

  function parseInt(s: string | number, radix?: number): number
  function parseFloat(string: string | number): number

  const __VUETIFY_VERSION__: string
  const __REQUIRED_VUE__: string
}
