// Components
import VImg from '../VImg/VImg'

// Utils
import { deprecate } from '../../util/console'

// Vue
import { defineComponent, onMounted } from 'vue'

/* istanbul ignore next */
export default defineComponent({
  name: 'v-card-media',
  extends: VImg,
  setup (props) {
    onMounted(() => {
      deprecate('v-card-media', props.src ? 'v-img' : 'v-responsive')
    })
    return {}
  }
})
