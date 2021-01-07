function verifyJWT (request, reply, done) {
  const jwt = require('fastify-jwt')

  if (request.body && request.body.failureWithReply) {
    reply.code(401).send({ error: 'Unauthorized' })
    return done(new Error())
  }

  if (!request.raw.headers.auth) {
    return done(new Error('Missing token header'))
  }

  jwt.verify(request.raw.headers.auth, onVerify)

  function onVerify (err, decoded) {
    if (err || !decoded.user || !decoded.password) {
      return done(new Error('Token not valid'))
    }

    level.get(decoded.user, onUser)

    function onUser (err, password) {
      if (err) {
        if (err.notFound) {
          return done(new Error('Token not valid'))
        }
        return done(err)
      }

      if (!password || password !== decoded.password) {
        return done(new Error('Token not valid'))
      }

      done()
    }
  }
}
