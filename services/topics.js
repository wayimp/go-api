const topicSchema = require('../schema/topic')
const moment = require('moment-timezone')
const dateFormat = 'YYYY-MM-DDTHH:mm:SS'
const { ObjectId } = require('mongodb')
var flatten = require('lodash.flatten')

const updateOne = {
  body: {
    topicSchema
  }
}

const updateMany = {
  body: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        _id: {
          type: 'string'
        },
        order: {
          type: 'integer'
        }
      }
    }
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

  fastify.patch('/topicOrder', { schema: updateMany }, async function (
    request,
    reply
  ) {
    //await request.jwtVerify()

    const { body } = request

    console.log(JSON.stringify(body))

    body.map(item => {
      topicsCollection.updateOne(
        {
          _id: ObjectId(item._id)
        },
        { $set: { order: item.order } }
      )
    })

    return true
  })

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

  fastify.get('/topic/:title', multiple, async (request, reply) => {
    const result = await topicsCollection.findOne({
      title: decodeURIComponent(request.params.title)
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
          sections: 0,
          modified: 0
        })
        .toArray()

      return result
    } catch (err) {
      reply.send(err)
    }
  })

  fastify.get('/topicTags', multiple, async (request, reply) => {
    try {
      const { query } = request

      const findParams = {
        active: true
      }

      if (query.showInactive) {
        delete findParams.active
      }

      const pipeline = [
        {
          $match: {
            active: true,
            category: { $ne: 'front' }
          }
        },
        {
          $unwind: {
            path: '$sections',
            preserveNullAndEmptyArrays: false
          }
        },
        {
          $match: {
            'sections.version': 'HCSB'
          }
        },
        {
          $project: {
            'sections.name': 1,
            'sections.tags': 1
          }
        }
      ]

      const topics = await topicsCollection.aggregate(pipeline).toArray()

      const topicTags = topics.map(topic => {
        const tags = topic.sections.tags.map(tag => ({
          tagName: tag,
          topicName: topic.sections.name,
          id: topic._id
        }))

        if (topic.sections.name) {
          const words = topic.sections.name.trim().split(' ')
          words.map(word => {
            tags.unshift({
              tagName: word.replace(/\W/g, ''),
              topicName: topic.sections.name,
              id: topic._id
            })
          })
        }

        return tags
      })

      const filteredTags = flatten(topicTags).filter(t => t.tagName)
      return flatten(filteredTags)
    } catch (err) {
      reply.send(err)
    }
  })

  fastify.get('/topicNames', multiple, async (request, reply) => {
    try {
      const { query } = request

      const pipeline = [
        {
          $match: { active: true }
        },
        {
          $sort: {
            category: 1,
            order: 1
          }
        },
        {
          $unwind: {
            path: '$sections',
            preserveNullAndEmptyArrays: false
          }
        },
        {
          $match: {
            'sections.version': 'HCSB'
          }
        },
        {
          $project: {
            category: 1,
            'sections.name': 1
          }
        }
      ]

      const result = await topicsCollection.aggregate(pipeline).toArray()

      const topicNames = result.map(t => ({
        id: t._id,
        category: t.category,
        topicName: t.sections.name
      }))

      return topicNames
    } catch (err) {
      reply.send(err)
    }
  })

  fastify.post('/topics', { schema: updateOne }, async function (
    request,
    reply
  ) {
    await request.jwtVerify()

    const { body } = request
    body.order = Number(body.order)
    body.active = true

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
