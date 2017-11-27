import beimo from 'beimo'
import Koa from 'koa'
import Router from 'koa-router'

const app = new Koa()
const router = new Router()

router.get('/json-user', ctx => {
  ctx.body = JSON.stringify({ name: 'John doe 2' })
})

router.get('*', ctx => beimo.render(ctx.req, ctx.res, ctx.query))

app.use(router.routes())

export default beimo.prepare(app, () => {
  // This code will only be fire on release mode
  app.listen(3000, () => console.info('> Ready on http://localhost:3000'))
})
