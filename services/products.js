const productSchema = require('../schema/product')
const moment = require('moment-timezone')
const dateFormat = 'YYYY-MM-DDTHH:mm:SS'
const { ObjectId } = require('mongodb')

const updateOne = {
  body: {
    productSchema
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
      200: { productSchema }
    }
  }
}

const multiple = {
  200: {
    description: 'products',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        result: { productSchema }
      }
    }
  }
}

async function routes (fastify, options) {
  const productsCollection = fastify.mongo.db.collection('products')
  const jwt = fastify.jwt

  fastify.post('/products', { schema: updateOne }, async function (
    request,
    reply
  ) {
    await request.jwtVerify()

    const created = await productsCollection.insertOne(request.body)
    created.id = created.ops[0]._id

    return created
  })

  fastify.patch('/products', { schema: updateOne }, async function (
    request,
    reply
  ) {
    const { body } = request
    const id = body._id
    delete body._id

    const updated = await productsCollection.updateOne(
      {
        _id: ObjectId(id)
      },
      { $set: body },
      { upsert: true }
    )

    return updated
  })

  fastify.get('/products/:id', multiple, async (request, reply) => {
    const result = await productsCollection.findOne({
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

  fastify.get('/products', multiple, async (request, reply) => {
    try {
      const { query } = request

      const findParams = { active: true }

      if (query.showInactive) {
        delete findParams.active
      }

      const result = productsCollection
        .find(findParams)
        .sort({ order: 1 })
        .toArray()

      return result
    } catch (err) {
      reply.send(err)
    }
  })

  fastify.delete(
    '/products/:id',
    { schema: deleteOne },
    async (request, reply) => {
      const {
        params: { id }
      } = request
      await request.jwtVerify()
      const result = await productsCollection.deleteOne({ _id: ObjectId(id) })
      return result
    }
  )
}

module.exports = routes
