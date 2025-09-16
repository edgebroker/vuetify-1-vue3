// Styles
import '@/css/vuetify.css'

// Composables
import useSsrBootable from '../../composables/useSsrBootable'

// Types
import { defineComponent, h, computed, getCurrentInstance, ref } from 'vue'

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
    const proxy = vm?.proxy as any
    const contentRef = ref<HTMLElement | null>(null)

    const fallbackApplication = { bar: 0, top: 0, right: 0, footer: 0, insetFooter: 0, bottom: 0, left: 0 }
    const application = computed(() => proxy?.$vuetify?.application ?? fallbackApplication)

    const styles = computed(() => {
      const { bar, top, right, footer, insetFooter, bottom, left } = application.value
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
      ref: contentRef,
    }, [h('div', { class: 'v-content__wrap' }, slots.default?.())])
  }
})

