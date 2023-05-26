const topicSchema = require('../schema/topic')
const moment = require('moment-timezone')
const dateFormat = 'YYYY-MM-DDTHH:mm:SS'
const { ObjectId } = require('mongodb')
var flatten = require('lodash.flatten')
const { email } = require('../notify')

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

async function routes(fastify, options) {
  const settingsCollection = fastify.mongo.db.collection('settings')
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

  fastify.get('/featured', multiple, async (request, reply) => {
    try {
      const { query } = request

      const findParams = {
        active: true,
        featured: true
      }

      const result = topicsCollection
        .find(findParams)
        .sort([['order', 1]])
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
          $project: {
            'sections.version': 1,
            'sections.name': 1,
            'sections.tags': 1
          }
        }
      ]

      const topics = await topicsCollection.aggregate(pipeline).toArray()

      const topicTags = topics.map(topic => {
        const tags = topic.sections.tags.map(tag => ({
          tagName: tag,
          version: topic.sections.version,
          topicName: topic.sections.name,
          id: topic._id
        }))

        if (topic.sections.name) {
          const words = topic.sections.name.trim().split(' ')
          words.map(word => {
            tags.unshift({
              tagName: word.replace(/\W/g, ''),
              version: topic.sections.version,
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
          $project: {
            category: 1,
            'sections.version': 1,
            'sections.name': 1,
          }
        }
      ]

      const result = await topicsCollection.aggregate(pipeline).toArray()

      const topicNames = result.map(t => ({
        id: t._id,
        category: t.category,
        version: t.sections.version,
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

  fastify.post('/question', { schema: updateOne }, async function (
    request,
    reply
  ) {
    const { body } = request
    body.active = true
    body.order = 0
    body.sections = []
    body.modified = new Date(moment().tz('America/Chicago'))
    const created = await topicsCollection.insertOne(body)
    created.id = created.ops[0]._id

    const settingsArray = await settingsCollection.find({}).toArray()
    const settings = {}
    settingsArray.map(setting => {
      settings[setting.name] = setting.value
    })

    email(
      settings.question_emails,
      `New Question From: ${body.name} <${body.email}>`,
      body.title
    )

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

  fastify.get('/category/:name', multiple, async (request, reply) => {
    try {
      const { name } = request.params

      const findParams = {
        active: true,
        category: name
      }

      const result = topicsCollection
        .find(findParams)
        .sort([['order', 1]])
        .toArray()

      return result
    } catch (err) {
      reply.send(err)
    }
  })
}

module.exports = routes
