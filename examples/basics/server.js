import express from 'express'
import beimo from '../../dist/server' // eslint-disable-line

const app = express()

app.use(express.static(beimo.staticPath))
app.get('*', async (req, res) => {
  await beimo.handle(req, res)
})

beimo.start(() =>
  app.listen(3002, () => {
    console.info('Listening at http://localhost:3002')
  }),
)
