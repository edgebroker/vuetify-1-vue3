import { computed } from 'vue'

const colorProps = {
  color: String
}

function isCssColor (color) {
  return !!color && !!color.match(/^(#|(rgb|hsl)a?\()/)
}

function setBackgroundColor (color, data = {}) {
  if (isCssColor(color)) {
    data.style = {
      ...data.style,
      'background-color': `${color}`,
      'border-color': `${color}`
    }
  } else if (color) {
    data.class = {
      ...data.class,
      [color]: true
    }
  }

  return data
}

function setTextColor (color, data = {}) {
  if (isCssColor(color)) {
    data.style = {
      ...data.style,
      color: `${color}`,
      'caret-color': `${color}`
    }
  } else if (color) {
    const [colorName, colorModifier] = color.toString().trim().split(' ', 2)

    data.class = {
      ...data.class,
      [`${colorName}--text`]: true
    }

    if (colorModifier) {
      data.class['text--' + colorModifier] = true
    }
  }

  return data
}

export default function useColorable (props) {
  const colorData = computed(() => setTextColor(props.color))

  const colorClasses = computed(() => colorData.value.class)
  const colorStyles = computed(() => colorData.value.style)

  return { colorClasses, colorStyles, setBackgroundColor, setTextColor }
}

export { colorProps, setBackgroundColor, setTextColor }
