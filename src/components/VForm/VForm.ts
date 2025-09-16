// Styles
import '@/css/vuetify.css'

// Composables
import useRegistrableProvide from '../../composables/useRegistrableProvide'

// Types
import { defineComponent, h, reactive, watch, provide, nextTick } from 'vue'

type FormControl = {
  _uid: number
  hasError: boolean
  shouldValidate: boolean
  validate: (force?: boolean) => boolean
  reset: () => void
  resetValidation: () => void
  $watch: (source: string, cb: (value: any) => void, options?: Record<string, any>) => () => void
}

type FormWatcher = {
  _uid: number
  valid?: () => void
  shouldValidate?: () => void
}

export default defineComponent({
  name: 'v-form',

  inheritAttrs: false,

  props: {
    value: Boolean,
    lazyValidation: Boolean,
  },

  setup (props, { slots, emit, attrs, expose }) {
    const { children } = useRegistrableProvide('form')
    const inputs = children as FormControl[]
    const formAttrs = attrs as Record<string, unknown>

    const watchers: FormWatcher[] = []
    const errorBag = reactive<Record<number, boolean>>({})

    function watchInput (input: FormControl): FormWatcher {
      const watchHasError = (target: FormControl) => target.$watch('hasError', (val: boolean) => {
        errorBag[target._uid] = val
      }, { immediate: true })

      const watchersObj: FormWatcher = { _uid: input._uid }

      if (props.lazyValidation) {
        watchersObj.shouldValidate = input.$watch('shouldValidate', (val: boolean) => {
          if (!val) return
          if (Object.prototype.hasOwnProperty.call(errorBag, input._uid)) return
          watchersObj.valid = watchHasError(input)
        })
      } else {
        watchersObj.valid = watchHasError(input)
      }

      return watchersObj
    }

    function register (input: FormControl) {
      const unwatch = watchInput(input)
      inputs.push(input)
      watchers.push(unwatch)
    }

    function unregister (input: FormControl) {
      const foundIndex = inputs.findIndex(i => i._uid === input._uid)
      if (foundIndex === -1) return

      const unwatch = watchers[foundIndex]
      unwatch.valid && unwatch.valid()
      unwatch.shouldValidate && unwatch.shouldValidate()

      watchers.splice(foundIndex, 1)
      inputs.splice(foundIndex, 1)
      delete errorBag[input._uid]
    }

    provide('form', { register, unregister })

    watch(errorBag, () => {
      const hasErrors = Object.values(errorBag).some(Boolean)
      emit('input', !hasErrors)
    }, { deep: true, immediate: true })

    function validate () {
      const errors = inputs.filter(input => !input.validate(true)).length
      return errors === 0
    }

    function reset () {
      for (let i = inputs.length - 1; i >= 0; i--) {
        inputs[i].reset()
      }
      if (props.lazyValidation) {
        nextTick(() => {
          Object.keys(errorBag).forEach(key => { delete errorBag[Number(key)] })
        })
      }
    }

    function resetValidation () {
      for (let i = inputs.length - 1; i >= 0; i--) {
        inputs[i].resetValidation()
      }
      if (props.lazyValidation) {
        nextTick(() => {
          Object.keys(errorBag).forEach(key => { delete errorBag[Number(key)] })
        })
      }
    }

    expose({ validate, reset, resetValidation })

    return () => h('form', {
      class: 'v-form',
      novalidate: true,
      ...formAttrs,
      onSubmit: (e: Event) => emit('submit', e),
    }, slots.default?.())
  }
})

