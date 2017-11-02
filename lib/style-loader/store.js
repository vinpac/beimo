const styles = []

function store(newStyles, { filepath }) {
  // Find or push
  const style = styles.find(s => s.filepath === filepath) || styles[styles.push({ filepath }) - 1]
  style.body = newStyles.map(s => s[1]).join('\n')


  return updatedStyles => {
    style.body = updatedStyles.map(s => s[1]).join('\n')
  }
}

store.getStyles = includeFilePath => ({
  id: 'style-loaded',
  body: styles.map(style => `${includeFilePath ? `/* ${style.filepath} */\n` : ''}${style.body}`).join('\n'),
})

module.exports = store
