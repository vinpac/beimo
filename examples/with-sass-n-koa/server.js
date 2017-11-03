import beimo from 'beimo'
import Koa from 'koa'
import Router from 'koa-router'

const app = new Koa()
const router = new Router()

router.get('*', async ctx => {
  console.log('Koa, yeah')
  await beimo.render(ctx.req, ctx.res, ctx.next, ctx.query)
  ctx.respond = false
})

app.use(router.routes())

export default beimo.prepare(app, () => {
  // This code will only be fire on release mode
  app.listen(3000, () => console.log('> Ready on http://localhost:3000'))
})
