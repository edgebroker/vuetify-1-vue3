import { defineComponent, h } from 'vue'
import VCard from './VCard'
import VCardMedia from './VCardMedia'
import VCardTitle from './VCardTitle'

const VCardActions = defineComponent({
  name: 'VCardActions',

  setup (_, { attrs, slots }) {
    return () => {
      const { class: className, ...restAttrs } = attrs as any
      return h('div', {
        ...restAttrs,
        class: ['v-card__actions', className]
      }, slots.default?.())
    }
  }
})

const VCardText = defineComponent({
  name: 'VCardText',

  setup (_, { attrs, slots }) {
    return () => {
      const { class: className, ...restAttrs } = attrs as any
      return h('div', {
        ...restAttrs,
        class: ['v-card__text', className]
      }, slots.default?.())
    }
  }
})

export { VCard, VCardMedia, VCardTitle, VCardActions, VCardText }

export default {
  $_vuetify_subcomponents: {
    VCard,
    VCardMedia,
    VCardTitle,
    VCardActions,
    VCardText
  }
}
