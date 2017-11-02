/* eslint-disable indent */
import path from 'path'
import loaderUtils from 'loader-utils'

module.exports = function styleLoader() {}

module.exports.pitch = function styleLoaderPitch(request) {
  if (this.cacheable) this.cacheable()

  const options = { add: true, ...loaderUtils.getOptions(this) }

  return `
    // style-loader: Adds some css to the DOM by adding a <style> tag
    var content = require(${loaderUtils.stringifyRequest(this, `!!${request}`)});
    if (typeof content === 'string') {
      content = [[module.id, content, '']];
    }

    ${!options.add ? '' : `
    var params = ${JSON.stringify(options)}

    // Prepare CSS Transformation
    params.transform = ${options.transform ? `require(${
        loaderUtils.stringifyRequest(this, `!${path.resolve(options.transform)}`)
      })` : 'undefined'};

    // Add filepath to options
    params.filepath = "${loaderUtils.getRemainingRequest(this).split('!').pop()}";

    // Add style
    var update = require(${
      loaderUtils.stringifyRequest(this, `!${path.join(
        __dirname,
        options.store ? 'store.js' : 'addStyles.js',
      )}`)
    })(content, params);`}

    if (content.locals) module.exports = content.locals;
  `
}
