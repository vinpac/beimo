import fs from 'fs'
import mkdirp from 'mkdirp'

export const readFile = file => new Promise((resolve, reject) => {
  fs.readFile(file, 'utf8', (err, data) => (err ? reject(err) : resolve(data)))
})

export const writeFile = (file, contents) => new Promise((resolve, reject) => {
  fs.writeFile(file, contents, 'utf8', err => (err ? reject(err) : resolve()))
})

export const makeDir = name => new Promise((resolve, reject) => {
  mkdirp(name, err => (err ? reject(err) : resolve()))
})

export const copyFile = (source, target) => new Promise((resolve, reject) => {
  let cbCalled = false
  function done(err) {
    if (!cbCalled) {
      cbCalled = true
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    }
  }

  const rd = fs.createReadStream(source)
  rd.on('error', err => done(err))
  const wr = fs.createWriteStream(target)
  wr.on('error', err => done(err))
  wr.on('close', err => done(err))
  rd.pipe(wr)
})
