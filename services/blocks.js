const blockSchema = require('../schema/block')
const moment = require('moment-timezone')
const dateFormat = 'YYYY-MM-DDTHH:mm:SS'
const { ObjectId } = require('mongodb')
const { validate, email, slack } = require('../notify')

const updateOne = {
  body: {
    blockSchema
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
      200: { blockSchema }
    }
  }
}

const multiple = {
  200: {
    description: 'blocks',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        result: { blockSchema }
      }
    }
  }
}

async function routes (fastify, options) {
  const blocksCollection = fastify.mongo.db.collection('blocks')
  const jwt = fastify.jwt

  fastify.patch('/blocks', { schema: updateOne }, async function (
    request,
    reply
  ) {
    await request.jwtVerify()

    const { body } = request
    body.modified = new Date(moment().tz('America/Chicago'))
    const id = body._id
    delete body._id

    const updated = await blocksCollection.updateOne(
      {
        _id: ObjectId(id)
      },
      { $set: body },
      { upsert: true }
    )

    return updated
  })

  fastify.get('/blocks/:id', multiple, async (request, reply) => {
    const result = await blocksCollection.findOne({
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

  fastify.get('/blocks', multiple, async (request, reply) => {
    try {
      const { query } = request

      const findParams = {
        active: true
      }

      if (query.showInactive) {
        delete findParams.active
      }

      if (query.category) {
        findParams.category = query.category
      }

      const result = blocksCollection
        .find(findParams)
        .sort([
          ['category', 1],
          ['order', 1]
        ])
        .toArray()

      return result
    } catch (err) {
      reply.send(err)
    }
  })

  fastify.post('/blocks', { schema: updateOne }, async function (
    request,
    reply
  ) {
    await request.jwtVerify()

    const created = await blocksCollection.insertOne(request.body)
    created.id = created.ops[0]._id

    return created
  })

  fastify.delete(
    '/blocks/:id',
    { schema: deleteOne },
    async (request, reply) => {
      const {
        params: { id }
      } = request
      await request.jwtVerify()
      const result = await blocksCollection.deleteOne({ _id: ObjectId(id) })
      return result
    }
  )
}

module.exports = routes
