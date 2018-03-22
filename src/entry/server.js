import express from 'express'
import bodyParser from 'body-parser'
import beimo, { STATIC_PATH } from 'beimo'

const app = express()

// Static files
app.use(express.static(STATIC_PATH))

// Body parser
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// Pages
app.get('*', (req, res) => beimo.handle(req, res))

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  beimo.renderError(error, req, res)
})

export default beimo.prepare(app, module, () =>
  app.listen(3000, () => {
    console.info(`The server is running at http://localhost:${3000}/`)
  }))
