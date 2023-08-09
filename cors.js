const fp = require('fastify-plugin')

async function setup(app) {
  // Wildcard OPTIONS handler for CORS preflight requests
  app.route({
    method: 'OPTIONS',
    url: '/*',
    handler: async (request, reply) => {
      var reqAllowedHeaders = request.headers['access-control-request-headers']
      if (reqAllowedHeaders !== undefined) {
        reply.header('Access-Control-Allow-Headers', reqAllowedHeaders)
      }
      let { origin } = request.headers
      if (
        origin == 'http://localhost:8045' ||
        origin == 'https://gothereforeministries.org' ||
        origin == 'https://www.gothereforeministries.org' ||
        origin == 'https://lifereferencemanual.net' ||
        origin == 'https://www.lifereferencemanual.net'
      ) {
        // This is fine
      } else {
        origin = '*'
      }
      reply
        .code(204)
        .header('Content-Length', '0')
        .header('Access-Control-Allow-Origin', origin)
        .header('Access-Control-Allow-Credentials', true)
        .header(
          'Access-Control-Allow-Methods',
          'GET,HEAD,PUT,PATCH,POST,DELETE'
        )
        .send()
    }
  })

  // See https://github.com/fastify/fastify-cors/issues/20
  app.addHook('onRequest', function (request, reply, next) {
    let { origin } = request.headers
    if (
      origin == 'http://localhost:8045' ||
      origin == 'https://gothereforeministries.org' ||
      origin == 'https://www.gothereforeministries.org' ||
      origin == 'https://lifereferencemanual.net' ||
      origin == 'https://www.lifereferencemanual.net'
    ) {
      // This is fine
    } else {
      origin = '*'
    }

    reply.header('Access-Control-Allow-Origin', origin)
    reply.header('Access-Control-Allow-Credentials', true)
    next()
  })
}

module.exports = fp(setup)
