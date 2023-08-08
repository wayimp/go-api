const fastify = require('fastify')({
  ignoreTrailingSlash: true,
  pluginTimeout: 0,
  logger: true
})

const helmet = require('@fastify/helmet')
const auth = require('@fastify/auth')
const jwt = require('@fastify/jwt')
//const fileUpload = require('fastify-file-upload')
 
//fastify.register(fileUpload)

//const verifyJWT = require('./verifyJWT')
//const verifyUser = require('./verifyUser')

fastify.register(helmet)
fastify.register(auth)
fastify.register(jwt, { secret: 'JauLnD7PhEpvfGOQrZJq' })
fastify.register(require('@fastify/cors'), {
  // put your options here
})
fastify.register(require('./mongodb'))
fastify.register(require('./services/users'))
fastify.register(require('./services/products'))
fastify.register(require('./services/orders'))
fastify.register(require('./services/workflows'))
fastify.register(require('./services/settings'))
fastify.register(require('./services/blocks'))
fastify.register(require('./services/images'))
fastify.register(require('./services/customers'))
fastify.register(require('./services/invoices'))
fastify.register(require('./services/payments'))
fastify.register(require('./services/contacts'))
fastify.register(require('./services/topics'))
fastify.register(require('./services/verses'))
fastify.register(require('./services/email'))
fastify.register(require('./services/metrics'))
fastify.register(require('./services/stories'))

//fastify.register(require('./plugins/authenticate'))

//fastify.decorate('verifyJWT', verifyJWT)
//fastify.decorate('verifyUser', verifyUser)

/*
fastify.addHook("onRequest", async (request, reply) => {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.send(err)
  }
})
*/

const start = async () => {
  try {
    await fastify.listen({ port: 8041, host: '::' })
    fastify.log.info(`server listening on ${fastify.server.address().port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()