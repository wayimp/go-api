const settingSchema = require('../schema/setting')
const moment = require('moment-timezone')
const dateFormat = 'YYYY-MM-DDTHH:mm:SS'
const { ObjectId } = require('mongodb')
const { validate, email, slack } = require('../notify')

const updateOne = {
  body: {
    settingSchema
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
      200: { settingSchema }
    }
  }
}

const multiple = {
  200: {
    description: 'settings',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        result: { settingSchema }
      }
    }
  }
}

async function routes (fastify, options) {
  const settingsCollection = fastify.mongo.db.collection('settings')
  const jwt = fastify.jwt

  fastify.patch('/settings', { schema: updateOne }, async function (
    request,
    reply
  ) {
    const { body } = request
    body.modified = new Date(moment().tz('America/Chicago'))
    const id = body._id
    delete body._id

    const updated = await settingsCollection.updateOne(
      {
        _id: ObjectId(id)
      },
      { $set: body },
      { upsert: true }
    )

    return updated
  })

  fastify.get('/settings/:id', multiple, async (request, reply) => {
    const result = await settingsCollection.findOne({
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

  fastify.get('/settings', multiple, async (request, reply) => {
    try {
      await request.jwtVerify()

      const { user, query } = request

      const findParams = {
      }

      if (query.search) {
        findParams.name = { $regex: query.search, $options: 'i' }
      }

      const result = settingsCollection
        .find(findParams)
        .sort([['name', 1]])
        .toArray()

      return result
    } catch (err) {
      reply.send(err)
    }
  })
}

module.exports = routes