import { defineComponent, h, mergeProps } from 'vue'

import VStepper from './VStepper'
import VStepperStep from './VStepperStep'
import VStepperContent from './VStepperContent'

function createStepperSection (className: string, name: string) {
  return defineComponent({
    name,

    setup (_, { attrs, slots }) {
      return () => h('div', mergeProps({ class: className }, attrs), slots.default?.())
    }
  })
}

const VStepperHeader = createStepperSection('v-stepper__header', 'v-stepper--header')
const VStepperItems = createStepperSection('v-stepper__items', 'v-stepper--items')

export {
  VStepper,
  VStepperContent,
  VStepperStep,
  VStepperHeader,
  VStepperItems
}

export default {
  $_vuetify_subcomponents: {
    VStepper,
    VStepperContent,
    VStepperStep,
    VStepperHeader,
    VStepperItems
  }
}
