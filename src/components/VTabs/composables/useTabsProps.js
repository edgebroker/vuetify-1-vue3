import { toRefs } from 'vue'

export const tabsProps = {
  activeClass: {
    type: String,
    default: 'v-tabs__item--active'
  },
  alignWithTitle: Boolean,
  centered: Boolean,
  fixedTabs: Boolean,
  grow: Boolean,
  height: {
    type: [Number, String],
    default: undefined,
    validator: v => !isNaN(parseInt(v, 10))
  },
  hideSlider: Boolean,
  iconsAndText: Boolean,
  mandatory: {
    type: Boolean,
    default: true
  },
  mobileBreakPoint: {
    type: [Number, String],
    default: 1264,
    validator: v => !isNaN(parseInt(v, 10))
  },
  nextIcon: {
    type: String,
    default: '$vuetify.icons.next'
  },
  prevIcon: {
    type: String,
    default: '$vuetify.icons.prev'
  },
  right: Boolean,
  showArrows: Boolean,
  sliderColor: {
    type: String,
    default: 'accent'
  },
  value: [Number, String]
}

export default function useTabsProps (props) {
  return toRefs(props)
}
