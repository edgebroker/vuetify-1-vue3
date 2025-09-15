// Styles
import '@/css/vuetify.css'

// Composables
import useRegistrableProvide from '../../composables/useRegistrableProvide'

// Types
import { defineComponent, h, reactive, watch, provide } from 'vue'

export default defineComponent({
  name: 'v-form',

  inheritAttrs: false,

  props: {
    value: Boolean,
    lazyValidation: Boolean,
  },

  setup (props, { slots, emit, attrs, expose }) {
    const { children: inputs } = useRegistrableProvide('form')

    const watchers = []
    const errorBag = reactive({})

    function watchInput (input) {
      const watcher = input => input.$watch('hasError', val => { errorBag[input._uid] = val }, { immediate: true })
      const watchersObj = { _uid: input._uid, valid: undefined, shouldValidate: undefined }

      if (props.lazyValidation) {
        watchersObj.shouldValidate = input.$watch('shouldValidate', val => {
          if (!val) return
          if (errorBag.hasOwnProperty(input._uid)) return
          watchersObj.valid = watcher(input)
        })
      } else {
        watchersObj.valid = watcher(input)
      }

      return watchersObj
    }

    function register (input) {
      const unwatch = watchInput(input)
      inputs.push(input)
      watchers.push(unwatch)
    }

    function unregister (input) {
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
      const errors = Object.values(errorBag).includes(true)
      emit('input', !errors)
    }, { deep: true, immediate: true })

    function validate () {
      const errors = inputs.filter(input => !input.validate(true)).length
      return !errors
    }

    function reset () {
      for (let i = inputs.length; i--;) {
        inputs[i].reset()
      }
      if (props.lazyValidation) {
        setTimeout(() => { Object.keys(errorBag).forEach(k => delete errorBag[k]) }, 0)
      }
    }

    function resetValidation () {
      for (let i = inputs.length; i--;) {
        inputs[i].resetValidation()
      }
      if (props.lazyValidation) {
        setTimeout(() => { Object.keys(errorBag).forEach(k => delete errorBag[k]) }, 0)
      }
    }

    expose({ validate, reset, resetValidation })

    return () => h('form', {
      class: 'v-form',
      novalidate: true,
      ...attrs,
      onSubmit: e => emit('submit', e),
    }, slots.default?.())
  }
})

