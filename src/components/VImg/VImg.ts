import "@/css/vuetify.css"

// Types
import { defineComponent, h, ref, computed, watch, onMounted, getCurrentInstance } from 'vue'
import { PropType } from 'vue'

// Components
import VResponsive from '../VResponsive'

// Utils
import { consoleError, consoleWarn } from '../../util/console'

export interface srcObject {
  src: string
  srcset?: string
  lazySrc: string
  aspect: number
}

export default defineComponent({
  name: 'v-img',

  props: {
    ...(VResponsive as any).props,
    alt: String,
    contain: Boolean,
    src: {
      type: [String, Object] as PropType<string | srcObject>,
      default: ''
    },
    gradient: String,
    lazySrc: String,
    srcset: String,
    sizes: String,
    position: {
      type: String,
      default: 'center center'
    },
    transition: {
      type: [Boolean, String],
      default: 'fade-transition'
    }
  },

  setup (props, { slots, emit, attrs }) {
    const currentSrc = ref('')
    const image = ref<HTMLImageElement | null>(null)
    const isLoading = ref(true)
    const calculatedAspectRatio = ref<number | undefined>(undefined)

    const normalisedSrc = computed<srcObject>(() => {
      return typeof props.src === 'string'
        ? {
            src: props.src,
            srcset: props.srcset,
            lazySrc: props.lazySrc,
            aspect: Number((props as any).aspectRatio || calculatedAspectRatio.value)
          }
        : {
            src: (props.src as srcObject).src,
            srcset: props.srcset || (props.src as srcObject).srcset,
            lazySrc: props.lazySrc || (props.src as srcObject).lazySrc,
            aspect: Number((props as any).aspectRatio || (props.src as srcObject).aspect || calculatedAspectRatio.value)
          }
    })

    const computedAspectRatio = computed(() => normalisedSrc.value.aspect)

    const __cachedImage = computed(() => {
      if (!(normalisedSrc.value.src || normalisedSrc.value.lazySrc)) return []
      const backgroundImage: string[] = []
      const src = isLoading.value ? normalisedSrc.value.lazySrc : currentSrc.value
      if (props.gradient) backgroundImage.push(`linear-gradient(${props.gradient})`)
      if (src) backgroundImage.push(`url("${src}")`)
      const imageVNode = h('div', {
        class: {
          'v-image__image': true,
          'v-image__image--preload': isLoading.value,
          'v-image__image--contain': props.contain,
          'v-image__image--cover': !props.contain
        },
        style: {
          backgroundImage: backgroundImage.join(', '),
          backgroundPosition: props.position
        },
        key: +isLoading.value
      })
      if (!props.transition) return imageVNode
      return h('transition', { name: props.transition as string, mode: 'in-out' }, { default: () => [imageVNode] })
    })

    function pollForSize (img: HTMLImageElement, timeout: number | null = 100) {
      const poll = () => {
        const { naturalHeight, naturalWidth } = img
        if (naturalHeight || naturalWidth) {
          calculatedAspectRatio.value = naturalWidth / naturalHeight
        } else {
          timeout != null && setTimeout(poll, timeout)
        }
      }
      poll()
    }

    function getSrc () {
      if (image.value) currentSrc.value = (image.value as any).currentSrc || image.value.src
    }

    function onLoad () {
      getSrc()
      isLoading.value = false
      emit('load', props.src)
    }

    const instance = getCurrentInstance()

    function onError () {
      consoleError(`Image load failed\n\nsrc: ${normalisedSrc.value.src}`, instance?.proxy)
      emit('error', props.src)
    }

    function loadImage () {
      const img = new Image()
      image.value = img

      img.onload = () => {
        if ((img as any).decode) {
          (img as any).decode().catch((err: DOMException) => {
            consoleWarn(
              `Failed to decode image, trying to render anyway\n\nsrc: ${normalisedSrc.value.src}` +
              (err.message ? `\nOriginal error: ${err.message}` : ''),
              instance?.proxy
            )
          }).then(onLoad)
        } else {
          onLoad()
        }
      }
      img.onerror = onError
      img.src = normalisedSrc.value.src
      if (props.sizes) img.sizes = props.sizes
      if (normalisedSrc.value.srcset) img.srcset = normalisedSrc.value.srcset
      if (!(props as any).aspectRatio) pollForSize(img)
      getSrc()
    }

    function init () {
      if (normalisedSrc.value.lazySrc) {
        const lazyImg = new Image()
        lazyImg.src = normalisedSrc.value.lazySrc
        pollForSize(lazyImg, null)
      }
      if (normalisedSrc.value.src) loadImage()
    }

    function __genPlaceholder () {
      if (slots.placeholder) {
        const placeholder = isLoading.value
          ? [h('div', { class: 'v-image__placeholder' }, slots.placeholder())]
          : []
        if (!props.transition) return placeholder[0]
        return h('transition', { name: props.transition as string }, { default: () => placeholder })
      }
    }

    watch(() => props.src, () => {
      if (!isLoading.value) init()
      else loadImage()
    })

    onMounted(() => {
      init()
    })

    return () => {
      return h(VResponsive, {
        ...attrs,
        aspectRatio: computedAspectRatio.value,
        class: ['v-image', attrs.class],
        role: props.alt ? 'img' : undefined,
        'aria-label': props.alt
      }, {
        default: () => [
          __cachedImage.value as any,
          __genPlaceholder(),
          slots.default?.()
        ]
      })
    }
  }
})
