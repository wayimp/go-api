const userSchema = require('../schema/user')
const { ObjectId } = require('mongodb')

const login = {
  schema: {
    response: {
      body: {
        username: { type: 'string' },
        password: { type: 'string' }
      }
    }
  }
}

const updateOne = {
  body: {
    userSchema
  }
}

const deleteOne = {
  response: {
    200: {}
  }
}

const single = {
  schema: {
    response: {
      200: { userSchema }
    }
  }
}

const multiple = {
  200: {
    description: 'list of users',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        result: { userSchema }
      }
    }
  }
}

async function routes (fastify, options) {
  const usersCollection = fastify.mongo.db.collection('users')

  fastify.post('/token', login, async function (request, reply) {
    const username =
      request.body && request.body.username ? request.body.username : ''
    const password =
      request.body && request.body.password ? request.body.password : ''

    const result = await usersCollection.find({ username: username }).toArray()

    const user = result[0]
    let token = ''

    if (user.password === password) {
      delete user.password
      token = await reply.jwtSign(user)
    }

    return { access_token: token, roles: user.roles }
  })

  fastify.get('/users', multiple, async (request, reply) => {
    try {
      await request.jwtVerify()

      const result = usersCollection
        .find({})
        .sort({ roles: 1 })
        .project({
          password: 0
        })
        .toArray()

      return result
    } catch (err) {
      reply.send(err)
    }
  })

  fastify.post('/users', { schema: updateOne }, async function (
    request,
    reply
  ) {
    await request.jwtVerify()

    const created = await usersCollection.insertOne(request.body)
    created.id = created.ops[0]._id

    return created
  })

  fastify.delete(
    '/users/:id',
    { schema: deleteOne },
    async (request, reply) => {
      const {
        params: { id }
      } = request
      await request.jwtVerify()
      const result = await usersCollection.deleteOne({ _id: ObjectId(id) })
      return result
    }
  )
}
module.exports = routes
