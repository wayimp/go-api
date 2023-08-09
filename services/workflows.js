const workflowSchema = require('../schema/workflow')
const { ObjectId } = require('mongodb')

const login = {
  schema: {
    response: {
      body: {
        order: { type: 'number' },
        action: { type: 'string' }
      }
    }
  }
}

const updateOne = {
  body: {
    workflowSchema
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
      200: { workflowSchema }
    }
  }
}

const multiple = {
  200: {
    description: 'list of workflows',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        result: { workflowSchema }
      }
    }
  }
}

async function routes (fastify, options) {
  const workflowsCollection = fastify.mongo.db.collection('workflows')

  fastify.get('/workflows', multiple, async (request, reply) => {
    try {

      const result = workflowsCollection
        .find({})
        .sort({ order: 1 })
        .toArray()

      return result
    } catch (err) {
      reply.send(err)
    }
  })

  fastify.post('/workflows', { schema: updateOne }, async function (
    request,
    reply
  ) {
    await request.jwtVerify()

    const created = await workflowsCollection.insertOne(request.body)
    if (created?.insertedId) {
      created.id = created.insertedId
    }

    return created
  })


  fastify.patch('/workflows', { schema: updateOne }, async function (
    request,
    reply
  ) {
    const { body } = request
    const id = body._id
    delete body._id

    const updated = await workflowsCollection.updateOne(
      {
        _id: new ObjectId(id)
      },
      { $set: body },
      { upsert: true }
    )

    return updated
  })

  fastify.delete(
    '/workflows/:id',
    { schema: deleteOne },
    async (request, reply) => {
      const {
        params: { id }
      } = request
      await request.jwtVerify()
      const result = await workflowsCollection.deleteOne({ _id: new ObjectId(id) })
      return result
    }
  )
}
module.exports = routes
