import express from 'express'
import bodyParser from 'body-parser'
import beimo from './app'

const app = express()

// Static files
app.use(express.static(beimo.staticPath))

// Body parser
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// Pages
app.get('*', async (req, res, next) => {
  try {
    await beimo.render(req, res, req.query)
  } catch (error) {
    next(error)
  }
})

export default beimo.prepare(app, () =>
  app.listen(process.env.PORT, () => {
    console.info(`The server is running at http://localhost:${process.env.PORT}/`)
  }))
