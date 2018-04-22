import yaml from 'js-yaml'
import fs from 'fs'
import createRouterMap from '../create-router-map'

export default (async function loadRouterMapAsync(filepath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filepath, 'utf8', (error, body) => {
      if (error) {
        reject(error)
        return
      }

      resolve(createRouterMap(yaml.load(body)))
    })
  })
})
