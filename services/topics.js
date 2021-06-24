const topicSchema = require('../schema/topic')
const moment = require('moment-timezone')
const dateFormat = 'YYYY-MM-DDTHH:mm:SS'
const { ObjectId } = require('mongodb')

const updateOne = {
  body: {
    topicSchema
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
      200: { topicSchema }
    }
  }
}

const multiple = {
  200: {
    description: 'topics',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        result: { topicSchema }
      }
    }
  }
}

async function routes (fastify, options) {
  const topicsCollection = fastify.mongo.db.collection('topics')
  const jwt = fastify.jwt

  fastify.patch('/topics', { schema: updateOne }, async function (
    request,
    reply
  ) {
    //await request.jwtVerify()

    const { body } = request
    body.order = Number(body.order)
    body.modified = new Date(moment().tz('America/Chicago'))
    const id = body._id
    delete body._id

    const updated = await topicsCollection.updateOne(
      {
        _id: ObjectId(id)
      },
      { $set: body },
      { upsert: true }
    )

    return updated
  })

  fastify.get('/topics/:id', multiple, async (request, reply) => {
    const result = await topicsCollection.findOne({
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

  fastify.get('/topics', multiple, async (request, reply) => {
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

      const result = topicsCollection
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

  fastify.get('/topicTitles', multiple, async (request, reply) => {
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

      const result = topicsCollection
        .find(findParams)
        .sort([
          ['category', 1],
          ['order', 1]
        ])
        .project({
          active: 0,
          category: 0,
          sections: 0,
          modified: 0
        })
        .toArray()

      return result
    } catch (err) {
      reply.send(err)
    }
  })

  fastify.post('/topics', { schema: updateOne }, async function (
    request,
    reply
  ) {
    //await request.jwtVerify()

    const { body } = request
    body.order = Number(body.order)

    const created = await topicsCollection.insertOne(body)
    created.id = created.ops[0]._id

    return created
  })

  fastify.delete(
    '/topics/:id',
    { schema: deleteOne },
    async (request, reply) => {
      const {
        params: { id }
      } = request
      //await request.jwtVerify()
      const result = await topicsCollection.deleteOne({ _id: ObjectId(id) })
      return result
    }
  )
}

module.exports = routes
