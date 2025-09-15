import '@/css/vuetify.css'

// Composables
import useColorable, { colorProps } from '../../composables/useColorable'
import useRoutable, { routableProps } from '../../composables/useRoutable'
import useThemeable, { themeProps } from '../../composables/useThemeable'

// Utils
import { deprecate } from '../../util/console'

// Types
import { defineComponent, h, computed, onMounted, getCurrentInstance } from 'vue'

export default defineComponent({
  name: 'v-jumbotron',

  props: {
    gradient: String,
    height: {
      type: [Number, String],
      default: '400px'
    },
    src: String,
    tag: {
      type: String,
      default: 'div'
    },
    ...colorProps,
    ...routableProps,
    ...themeProps
  },

  setup (props, { slots, attrs, emit }) {
    const { setBackgroundColor } = useColorable(props)
    const { generateRouteLink } = useRoutable(props, { attrs, emit })
    const { themeClasses } = useThemeable(props)
    const vm = getCurrentInstance()

    const backgroundStyles = computed(() => {
      const styles = {}
      if (props.gradient) {
        styles.background = `linear-gradient(${props.gradient})`
      }
      return styles
    })

    const classes = computed(() => themeClasses.value)
    const styles = computed(() => ({ height: props.height }))

    function genBackground () {
      return h('div', setBackgroundColor(props.color, {
        class: 'v-jumbotron__background',
        style: backgroundStyles.value
      }))
    }

    function genContent () {
      return h('div', { class: 'v-jumbotron__content' }, slots.default?.())
    }

    function genImage () {
      if (!props.src) return null
      if (slots.img) return slots.img({ src: props.src })
      return h('img', {
        class: 'v-jumbotron__image',
        src: props.src
      })
    }

    function genWrapper () {
      return h('div', { class: 'v-jumbotron__wrapper' }, [
        genImage(),
        genBackground(),
        genContent()
      ])
    }

    onMounted(() => {
      deprecate('v-jumbotron', props.src ? 'v-img' : 'v-responsive', vm)
    })

    return () => {
      const { tag, data } = generateRouteLink(classes.value)
      data.class = ['v-jumbotron', data.class]
      data.style = { ...styles.value, ...data.style }
      return h(tag, data, [genWrapper()])
    }
  }
})
