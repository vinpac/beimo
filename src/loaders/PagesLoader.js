module.exports = function PagesLoader(source) {
  return source.replace(/page\s*:\s*((?:'([^']+)')|(?:"([^"]+)"))/g, (match, str) => {
    const pagePath = str.substr(1, str.length - 2)
    return `${match}, load: () => import(/* webpackChunkName: 'pages/${pagePath}' */'./${pagePath}')`
  })
}
