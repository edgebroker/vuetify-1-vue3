export type MouseHandler = (e: MouseEvent | TouchEvent) => any

export type EmitFn = (event: string, ...args: any[]) => void

export type MouseEvents = {
  [event: string]: {
    event: string
    passive?: boolean
    capture?: boolean
    once?: boolean
    stop?: boolean
    prevent?: boolean
    button?: number
    result?: any
  }
}

export type MouseEventsMap = {
  [event: string]: MouseHandler | MouseHandler[]
}

export default function useMouse (emit: EmitFn) {
  function getMouseEventHandlers (events: MouseEvents, getEvent: MouseHandler): MouseEventsMap {
    const on: MouseEventsMap = {}

    for (const event in events) {
      const opts = events[event]
      const handler: MouseHandler = e => {
        const mouseEvent: MouseEvent = e as MouseEvent
        if (opts.button === undefined || (mouseEvent.buttons > 0 && mouseEvent.button === opts.button)) {
          if (opts.prevent) e.preventDefault()
          if (opts.stop) e.stopPropagation()
          emit(event, getEvent(e))
        }
        return opts.result
      }

      if (on[opts.event]) {
        const current = on[opts.event]
        if (Array.isArray(current)) current.push(handler)
        else on[opts.event] = [current, handler]
      } else {
        on[opts.event] = handler
      }
    }

    return on
  }

  function getDefaultMouseEventHandlers (suffix: string, getEvent: MouseHandler): MouseEventsMap {
    return getMouseEventHandlers({
      ['click' + suffix]: { event: 'click' },
      ['contextmenu' + suffix]: { event: 'contextmenu', prevent: true, result: false },
      ['mousedown' + suffix]: { event: 'mousedown' },
      ['mousemove' + suffix]: { event: 'mousemove' },
      ['mouseup' + suffix]: { event: 'mouseup' },
      ['mouseenter' + suffix]: { event: 'mouseenter' },
      ['mouseleave' + suffix]: { event: 'mouseleave' },
      ['touchstart' + suffix]: { event: 'touchstart' },
      ['touchmove' + suffix]: { event: 'touchmove' },
      ['touchend' + suffix]: { event: 'touchend' }
    }, getEvent)
  }

  return { getMouseEventHandlers, getDefaultMouseEventHandlers }
}
