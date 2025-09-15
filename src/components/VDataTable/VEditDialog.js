import '@/css/vuetify.css'

// Components
import VBtn from '../VBtn'
import VMenu from '../VMenu'

// Composables
import useReturnable, { returnableProps } from '../../composables/useReturnable'
import useThemeable, { themeProps } from '../../composables/useThemeable'

// Utils
import { keyCodes } from '../../util/helpers'

// Types
import { defineComponent, h, nextTick, ref, watch } from 'vue'

export default defineComponent({
  name: 'v-edit-dialog',

  props: {
    ...returnableProps,
    ...themeProps,
    cancelText: {
      type: String,
      default: 'Cancel',
    },
    large: Boolean,
    lazy: Boolean,
    persistent: Boolean,
    saveText: {
      type: String,
      default: 'Save',
    },
    transition: {
      type: String,
      default: 'slide-x-reverse-transition',
    },
  },

  emits: ['open', 'close', 'cancel', 'save', 'update:returnValue'],

  setup (props, { emit, slots }) {
    const isActive = ref(false)
    const contentRef = ref(null)

    const { themeClasses } = useThemeable(props)
    const { save } = useReturnable(props, { isActive, emit })

    function focus () {
      const input = contentRef.value?.querySelector('input')
      input && input.focus()
    }

    function cancel () {
      isActive.value = false
      emit('cancel')
    }

    watch(isActive, val => {
      if (val) {
        emit('open')
        nextTick(() => {
          setTimeout(() => focus(), 50)
        })
      } else {
        emit('close')
      }
    })

    function genButton (fn, text) {
      return h(VBtn, {
        flat: true,
        color: 'primary',
        light: true,
        onClick: fn,
      }, {
        default: () => text,
      })
    }

    function genActions () {
      return h('div', {
        class: 'v-small-dialog__actions',
      }, [
        genButton(cancel, props.cancelText),
        genButton(() => {
          save(props.returnValue)
          emit('save')
        }, props.saveText),
      ])
    }

    function onKeydown (e) {
      const input = contentRef.value?.querySelector('input')
      if (e.keyCode === keyCodes.esc) {
        cancel()
      }
      if (e.keyCode === keyCodes.enter && input) {
        save(input.value)
        emit('save')
      }
    }

    function genContent () {
      return h('div', {
        ref: contentRef,
        onKeydown,
      }, slots.input?.())
    }

    return () => {
      const children = [genContent()]
      if (props.large) {
        children.push(genActions())
      }

      return h(VMenu, {
        class: ['v-small-dialog', themeClasses.value],
        contentClass: 'v-small-dialog__content',
        transition: props.transition,
        origin: 'top right',
        right: true,
        value: isActive.value,
        closeOnClick: !props.persistent,
        closeOnContentClick: false,
        lazy: props.lazy,
        light: props.light,
        dark: props.dark,
        onInput: val => { isActive.value = val },
      }, {
        activator: () => h('a', {}, slots.default?.()),
        default: () => children,
      })
    }
  },
})
