const fp = require('fastify-plugin')

async function setup (app) {
  // Wildcard OPTIONS handler for CORS preflight requests
  app.route({
    method: 'OPTIONS',
    url: '/*',
    handler: async (request, reply) => {

      var reqAllowedHeaders = request.headers['access-control-request-headers']
      if (reqAllowedHeaders !== undefined) {
        reply.header('Access-Control-Allow-Headers', reqAllowedHeaders)
      }
      reply.code(204)
        .header('Content-Length', '0')
        .header('Access-Control-Allow-Origin', '*')
        .header('Access-Control-Allow-Credentials', true)
        .header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE')
        .send()
    }
  })

  // CORS reply - 'Access-Control-Allow-Origin', '*' for now..
  // See https://github.com/fastify/fastify-cors/issues/20
  app.addHook('onRequest', function (request, reply, next) {
    reply.header('Access-Control-Allow-Origin', '*')
    reply.header('Access-Control-Allow-Credentials', true)
    next()
  })
}

module.exports = fp(setup)