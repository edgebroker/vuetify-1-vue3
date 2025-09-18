// Styles
import '@/css/vuetify.css'

// Extensions
import VSelect, { defaultMenuProps as VSelectMenuProps } from '../VSelect/VSelect'
import VTextField from '../VTextField/VTextField'

// Utils
import { keyCodes } from '../../util/helpers'

// Types
import { defineComponent, ref, computed, watch } from 'vue'

const menuPropsType = VSelect.options?.props?.menuProps?.type ?? VSelect.props?.menuProps?.type ?? [String, Array, Object]

const defaultMenuProps = {
  ...VSelectMenuProps,
  offsetY: true,
  offsetOverflow: true,
  transition: false
}

export default defineComponent({
  name: 'v-autocomplete',
  extends: VSelect,

  props: {
    allowOverflow: {
      type: Boolean,
      default: true
    },
    browserAutocomplete: {
      type: String,
      default: 'off'
    },
    filter: {
      type: Function,
      default: (item, queryText, itemText) => {
        return itemText.toLocaleLowerCase().indexOf(queryText.toLocaleLowerCase()) > -1
      }
    },
    hideNoData: Boolean,
    noFilter: Boolean,
    searchInput: {
      default: undefined
    },
    menuProps: {
      type: menuPropsType,
      default: () => defaultMenuProps
    },
    autoSelectFirst: {
      type: Boolean,
      default: false
    }
  },

  setup (props, { emit }) {
    const lazySearch = ref(props.searchInput)

    watch(() => props.searchInput, val => { lazySearch.value = val })

    const internalSearch = computed({
      get: () => lazySearch.value,
      set: val => {
        lazySearch.value = val
        emit('update:searchInput', val)
      }
    })

    return { lazySearch, internalSearch }
  }
})

