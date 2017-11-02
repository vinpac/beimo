const styles = []
let styleElement

function createStyleElementIfNoExists() {
  if (!styleElement) {
    const allStyles = document.getElementsByTagName('style')

    // Find element with data-style-loaded
    let i = 0
    for (; i < allStyles.length; i += 1) {
      if (allStyles[i].attributes['data-style-loaded']) {
        styleElement = allStyles[i]
        break
      }
    }


    if (!styleElement) {
      // Create new element
      styleElement = document.createElement('style')

      // Append to head
      document.head.appendChild(styleElement)
    }
  }
}

function updateStyleElementBody() {
  createStyleElementIfNoExists()

  styleElement.innerHTML = styles.map(style => `/* ${style.filepath} */\n${style.body}`).join('\n')
}

function addStyles(newStyles, { filepath }) {
  // Find or push
  const style = styles.find(s => s.filepath === filepath) || styles[styles.push({ filepath }) - 1]
  style.body = newStyles.map(s => s[1]).join('\n')
  updateStyleElementBody()

  return (updatedNewStyles, { remove } = {}) => {
    if (remove) {
      styles.splice(style, 1)
    } else {
      style.body = updatedNewStyles.map(s => s[1]).join('\n')
    }

    updateStyleElementBody()
  }
}

module.exports = addStyles
