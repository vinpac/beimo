import express from 'express'
import path from 'path'
import bodyParser from 'body-parser'
import beimo from './app'

const app = express()

// Static files
app.use(express.static(path.resolve(__dirname, process.env.STATIC_DIR)))

// Body parser
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// Routes
// app.use((req, res, next) => Router.handle(req, res, next))

// Pages
app.get('*', async (req, res, next) => {
  try {
    await beimo.render(req, res, next)
  } catch (error) {
    next(error)
  }
})

export default beimo.prepare(app, () =>
  app.listen(process.env.PORT, () => {
    console.info(`The server is running at http://localhost:${process.env.PORT}/`)
  }))
