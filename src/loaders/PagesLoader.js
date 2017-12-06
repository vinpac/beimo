/*
NOTE: THIS IS NOT A FINISHED FILE
This is only intended for testing of idea.

*/
/* eslint-disable no-continue */

const path = require('path')

const importRegex = /(?:import[\s\n]+((?:(?!from|;)[\s\S])*)[\s\n]+from[\s]+(?:'beimo\/page'|"beimo\/page"))/g
const strChars = ["'", '"', '`']

module.exports = function PagesLoader(rawSource) {
  if (this.cacheable) this.cacheable()

  const { pagesPath } = this.query

  let source = rawSource
  importRegex.lastIndex = 0
  const importMatch = importRegex.exec(rawSource)

  if (!importMatch) {
    return rawSource
  }

  const moduleAlias = importMatch[1].replace(/\{[^}]*\}|{|}|,/g, '').trim()

  let expect = null
  let skip = false
  let i = 0
  let name = ''
  let found = false
  let justFound = false
  let afterFound = false
  let str = ''
  let strStart
  let strEnd
  let hasMoreArgs = false
  let loadStatement
  for (; i < source.length; i += 1) {
    const char = source.charAt(i)
    const code = source.charCodeAt(i)

    if (expect !== null) {
      if (char === '\\') {
        if (skip) {
          str += '\\'
          continue
        }

        skip = true
        continue
      }

      if (expect === char) {
        if (skip) {
          skip = false
          continue
        }

        expect = null
        strEnd = i
        continue
      }

      if (skip) {
        skip = false
      }

      str += char
      continue
    }

    if ([32, 10, 9, 13].indexOf(code) !== -1) {
      name = ''
      continue
    }

    if (afterFound) {
      afterFound = false

      if (char !== '}') {
        source = `${source.substr(0, i)},${source.substr(i)}`
      }
    }

    if (found && !expect) {
      if (justFound) {
        if (char === ')') {
          throw new Error('page requires at least one argument')
        }

        justFound = false
      } else {
        if (!str) {
          throw new Error(
            "Dynamic page names are not supported. You must provide like so: page('page-path')",
          )
        }

        if (char === ',') {
          hasMoreArgs = true
          continue
        }

        if (!loadStatement) {
          if (!path.join(pagesPath, str).startsWith(pagesPath)) {
            throw new Error('You cannot use pages outside of the pages folder')
          }

          const chunkName = path.join('pages', path.relative(pagesPath, path.resolve(this.context, str)))

          // Replace first argument to reflet chunk name
          source = `${source.substr(0, strStart)}'${chunkName}${source.substr(strEnd)}`

          loadStatement = `load: () => import(/* webpackChunkName: '${chunkName}' */'${str}')`
          i += chunkName.length - str.length
        }

        if (hasMoreArgs) {
          found = false
          if (char === '(') {
            continue
          }

          if (char === '{') {
            source = `${source.substr(0, i)}{ ${loadStatement} ${source.substr(i + 1)}`
            i += loadStatement.length + 1
            found = false
            hasMoreArgs = false
            loadStatement = null
            afterFound = true
            continue
          }

          throw new Error('Sencond argument of page must be an object')
        } else if (char === ')') {
          source = `${source.substr(0, i)}, { ${loadStatement} })${source.substr(i + 1)}`
          i += loadStatement.length + 1
          found = false
          loadStatement = null
        }

        continue
      }
    }

    if (`${name}${char}` === `${moduleAlias}(`) {
      found = true
      justFound = true
      name = ''
      str = ''
      continue
    }

    const strCharIndex = strChars.indexOf(char)

    if (strCharIndex !== -1) {
      name = ''
      str = ''
      strStart = i

      expect = strChars[strCharIndex]
    } else if (!expect) {
      if ((code >= 65 && code <= 90) || code === 95 || (code >= 97 && code <= 122)) {
        name += char
      } else if (name && (code >= 45 && code <= 57)) {
        name += char
      } else {
        name = ''
      }
    }
  }

  return source
}
