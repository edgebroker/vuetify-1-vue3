// Styles
import '@/css/vuetify.css'

// Composables
import useSsrBootable from '../../composables/useSsrBootable'

// Types
import { defineComponent, h, computed, getCurrentInstance } from 'vue'

export default defineComponent({
  name: 'v-content',

  props: {
    tag: {
      type: String,
      default: 'main',
    },
  },

  setup (props, { slots }) {
    useSsrBootable()
    const vm = getCurrentInstance()

    const styles = computed(() => {
      const { bar, top, right, footer, insetFooter, bottom, left } = vm?.proxy.$vuetify.application
      return {
        paddingTop: `${top + bar}px`,
        paddingRight: `${right}px`,
        paddingBottom: `${footer + insetFooter + bottom}px`,
        paddingLeft: `${left}px`,
      }
    })

    return () => h(props.tag, {
      class: 'v-content',
      style: styles.value,
      ref: 'content',
    }, [h('div', { class: 'v-content__wrap' }, slots.default?.())])
  }
})

