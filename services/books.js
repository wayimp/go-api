const bookSchema = require('../schema/book')
const moment = require('moment-timezone')
const dateFormat = 'YYYY-MM-DDTHH:mm:SS'
const { ObjectId } = require('mongodb')

const updateOne = {
  body: {
    bookSchema
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
      200: { bookSchema }
    }
  }
}

const multiple = {
  200: {
    description: 'books',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        result: { bookSchema }
      }
    }
  }
}

async function routes (fastify, options) {
  const booksCollection = fastify.mongo.db.collection('books')
  const jwt = fastify.jwt

  fastify.post('/books', { schema: updateOne }, async function (
    request,
    reply
  ) {
    await request.jwtVerify()

    const created = await booksCollection.insertOne(request.body)
    created.id = created.ops[0]._id

    return created
  })

  fastify.patch('/books', { schema: updateOne }, async function (
    request,
    reply
  ) {
    const { body } = request
    const id = body._id
    delete body._id

    const updated = await booksCollection.updateOne(
      {
        _id: ObjectId(id)
      },
      { $set: body },
      { upsert: true }
    )

    return updated
  })

  fastify.get('/books/:id', multiple, async (request, reply) => {
    const result = await booksCollection.findOne({
      _id: ObjectId(request.params.id)
    })

    if (!result) {
      const err = new Error()
      err.statusCode = 400
      err.message = `id: ${id}.`
      throw err
    }

    return result
  })

  fastify.get('/books', multiple, async (request, reply) => {
    try {
      const { query } = request

      const findParams = { active: true }

      if (query.showInactive) {
        delete findParams.active
      }

      const result = booksCollection
        .find(findParams)
        .sort({ order: 1 })
        .toArray()

      return result
    } catch (err) {
      reply.send(err)
    }
  })

  fastify.delete(
    '/books/:id',
    { schema: deleteOne },
    async (request, reply) => {
      const {
        params: { id }
      } = request
      await request.jwtVerify()
      const result = await booksCollection.deleteOne({ _id: ObjectId(id) })
      return result
    }
  )
}

module.exports = routes
