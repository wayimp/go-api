const quoteSchema = require('../schema/quote')
const moment = require('moment-timezone')
const dateFormat = 'YYYY-MM-DDTHH:mm:SS'
const { ObjectId } = require('mongodb')
const { validate, email, slack } = require('../notify')

const updateOne = {
  body: {
    quoteSchema
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
      200: { quoteSchema }
    }
  }
}

const multiple = {
  200: {
    description: 'quotes',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        result: { quoteSchema }
      }
    }
  }
}

async function routes (fastify, options) {
  const quotesCollection = fastify.mongo.db.collection('quotes')
  const jwt = fastify.jwt

  fastify.patch('/quotes', { schema: updateOne }, async function (
    request,
    reply
  ) {
    await request.jwtVerify()

    const { body } = request
    body.modified = new Date(moment().tz('America/Chicago'))
    const id = body._id
    delete body._id

    const updated = await quotesCollection.updateOne(
      {
        _id: ObjectId(id)
      },
      { $set: body },
      { upsert: true }
    )

    return updated
  })

  fastify.get('/quotes/:id', multiple, async (request, reply) => {
    const result = await quotesCollection.findOne({
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

  fastify.get('/quotes', multiple, async (request, reply) => {
    try {
      const result = quotesCollection
        .find({})
        .sort([['order', 1]])
        .toArray()

      return result
    } catch (err) {
      reply.send(err)
    }
  })

  fastify.post('/quotes', { schema: updateOne }, async function (
    request,
    reply
  ) {
    await request.jwtVerify()

    const created = await quotesCollection.insertOne(request.body)
    created.id = created.ops[0]._id

    return created
  })

  fastify.delete(
    '/quotes/:id',
    { schema: deleteOne },
    async (request, reply) => {
      const {
        params: { id }
      } = request
      await request.jwtVerify()
      const result = await quotesCollection.deleteOne({ _id: ObjectId(id) })
      return result
    }
  )
}

module.exports = routes