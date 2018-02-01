class PagesChunkPlugin {
  static defaultNameResolver(chunk) {
    return chunk.name || null
  }

  constructor(nameResolver) {
    this.nameResolver = nameResolver || PagesChunkPlugin.defaultNameResolver
  }

  apply(compiler) {
    compiler.plugin('compilation', compilation => {
      compilation.plugin('before-chunk-ids', chunks => {
        chunks.forEach(chunk => {
          if (chunk.id === null) {
            chunk.id = this.nameResolver(chunk)
          }
        })
      })
    })
  }
}

export default PagesChunkPlugin
