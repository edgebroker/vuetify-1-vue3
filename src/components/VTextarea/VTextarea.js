// Styles
import "@/css/vuetify.css"

// Extensions
import VTextField, { useTextFieldController } from '../VTextField/VTextField'

// Utilities
import { consoleInfo } from '../../util/console'

// Types
import { computed, defineComponent, getCurrentInstance, nextTick, onMounted, ref, watch } from 'vue'

export default defineComponent({
  name: 'v-textarea',

  extends: VTextField,

  props: {
    autoGrow: Boolean,
    noResize: Boolean,
    outline: Boolean,
    rowHeight: {
      type: [Number, String],
      default: 24,
      validator: v => !isNaN(parseFloat(v))
    },
    rows: {
      type: [Number, String],
      default: 5,
      validator: v => !isNaN(parseInt(v, 10))
    }
  },

  setup (props, { emit, expose }) {
    expose()

    const vm = getCurrentInstance()
    const proxy = vm?.proxy

    const inputHeight = ref('auto')

    const { genInput: textFieldGenInput, onInput: textFieldOnInput } = useTextFieldController()

    const noResizeHandle = computed(() => props.noResize || props.autoGrow)

    const baseClasses = computed(() => proxy?.classes || {})

    const baseIsEnclosed = computed(() => proxy?.isEnclosed ?? false)

    const classes = computed(() => ({
      ...baseClasses.value,
      'v-textarea': true,
      'v-textarea--auto-grow': props.autoGrow,
      'v-textarea--no-resize': noResizeHandle.value
    }))

    const dynamicHeight = computed(() => props.autoGrow ? inputHeight.value : 'auto')

    const isEnclosed = computed(() => Boolean(proxy && proxy.textarea) || baseIsEnclosed.value)

    function calculateInputHeight () {
      const input = proxy && proxy.$refs ? proxy.$refs.input : null
      if (!input) return

      input.style.height = '0px'
      const height = input.scrollHeight
      const minHeight = parseInt(String(props.rows), 10) * parseFloat(String(props.rowHeight))
      const targetHeight = Math.max(minHeight, height)

      inputHeight.value = `${targetHeight}px`
      input.style.height = inputHeight.value
    }

    function genInput () {
      if (!textFieldGenInput) return null

      const input = textFieldGenInput()
      if (!input || !input.data) return input

      input.tag = 'textarea'

      const attrs = input.data.attrs || (input.data.attrs = {})
      if ('type' in attrs) delete attrs.type
      attrs.rows = props.rows

      input.data.style = { ...(input.data.style || {}), height: dynamicHeight.value }

      return input
    }

    function onInput (e) {
      textFieldOnInput && textFieldOnInput(e)
      if (props.autoGrow) calculateInputHeight()
    }

    function onKeyDown (e) {
      if (proxy?.isFocused && e.keyCode === 13) {
        e.stopPropagation()
      }

      if (proxy) proxy.internalChange = true
      emit('keydown', e)
    }

    watch(() => proxy?.lazyValue, () => {
      if (!proxy || proxy.internalChange || !props.autoGrow) return
      nextTick(() => calculateInputHeight())
    })

    watch(() => props.autoGrow, val => {
      if (!val) return
      nextTick(() => calculateInputHeight())
    })

    onMounted(() => {
      if (props.autoGrow) {
        nextTick(() => calculateInputHeight())
      }

      if (props.autoGrow && props.noResize) {
        consoleInfo('"no-resize" is now implied when using "auto-grow", and can be removed', proxy)
      }
    })

    return {
      classes,
      dynamicHeight,
      isEnclosed,
      noResizeHandle,
      calculateInputHeight,
      genInput,
      onInput,
      onKeyDown
    }
  }
})
