// Style
import "@/css/vuetify.css"

// Composables
import useTranslatable from '../../composables/useTranslatable'

// Types
import { defineComponent, h, ref, computed, watch, onMounted } from 'vue'

export default defineComponent({
  name: 'v-parallax',

  props: {
    alt: {
      type: String,
      default: ''
    },
    height: {
      type: [String, Number],
      default: 500
    },
    src: String
  },

  setup (props, { slots, attrs }) {
    const img = ref<HTMLImageElement | null>(null)
    const isBooted = ref(false)

    const { parallax, translate } = useTranslatable(props, {
      objHeight: () => img.value ? img.value.naturalHeight : 0
    })

    watch(parallax, () => {
      isBooted.value = true
    })

    function init () {
      const image = img.value
      if (!image) return

      if (image.complete) {
        translate()
      } else {
        image.addEventListener('load', onLoad, { once: true })
      }
    }

    function onLoad () {
      translate()
    }

    onMounted(() => {
      init()
    })

    const styles = computed(() => ({
      display: 'block',
      opacity: isBooted.value ? 1 : 0,
      transform: `translate(-50%, ${parallax.value}px)`
    }))

    return () => {
      const imgData = {
        staticClass: 'v-parallax__image',
        style: styles.value,
        attrs: {
          src: props.src,
          alt: props.alt
        },
        ref: img
      }

      const container = h('div', {
        staticClass: 'v-parallax__image-container'
      }, [
        h('img', imgData)
      ])

      const content = h('div', {
        staticClass: 'v-parallax__content'
      }, slots.default?.())

      const { class: classAttr, style: styleAttr, ...restAttrs } = attrs as any
      const mergedStyle = typeof styleAttr === 'object' ? styleAttr : {}

      return h('div', {
        staticClass: 'v-parallax',
        class: classAttr,
        style: {
          height: `${props.height}px`,
          ...mergedStyle
        },
        ...restAttrs
      }, [container, content])
    }
  }
})
