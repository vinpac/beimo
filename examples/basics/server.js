import express from 'express'
import beimo from '../../dist/server' // eslint-disable-line
import { getMessage } from './utils'

const app = express()

app.use(express.static(beimo.staticPath))
app.get('/abacate', (req, res) => res.json({ abacate: getMessage() }))
app.get('*', async (req, res) => {
  await beimo.handle(req, res)
})

beimo.start(() =>
  app.listen(3000, () => {
    console.info('Listening at http://localhost:3000')
  }),
)
