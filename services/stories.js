const moment = require('moment-timezone')
const dateFormat = 'YYYY-MM-DDTHH:mm:SS'
const { ObjectId } = require('mongodb')
const axios = require('axios')
const { validate, email } = require('../notify')

async function routes (fastify, options) {
  const storiesCollection = fastify.mongo.db.collection('stories')
  const settingsCollection = fastify.mongo.db.collection('settings')

  fastify.get('/stories', {}, async (request, reply) => {
    try {
      await request.jwtVerify()
      const result = storiesCollection.find({}).toArray()

      return result
    } catch (err) {
      reply.send(err)
    }
  })

  fastify.post('/stories', {}, async function (request, reply) {
    // This is the submit a story from the Go Therefore site
    try {
      const { body } = request

      const created = await storiesCollection.insertOne({
        ...body
      })

      if (validate(body.customerEmail)) {
        const settingsArray = await settingsCollection.find({}).toArray()
        const settings = {}
        settingsArray.map(setting => {
          settings[setting.name] = setting.value
        })

        email(
          settings.notification_emails,
          'A story has been submitted on the website.',
          `${body.customerName} <${body.customerEmail}>\n\n${body.location}\n\n${body.story}`
        )
      }

      return created
    } catch (err) {
      reply.send(err)
    }
  })

  fastify.patch('/stories', {}, async function (request, reply) {
    await request.jwtVerify()

    const { body } = request

    const id = body._id
    delete body._id

    const updated = await storiesCollection.updateOne(
      {
        _id: ObjectId(id)
      },
      { $set: body },
      { upsert: true }
    )

    return updated
  })

  fastify.delete('/stories/:id', {}, async (request, reply) => {
    try {
      const {
        params: { id }
      } = request
      await request.jwtVerify()
      const result = await storiesCollection.deleteOne({ _id: ObjectId(id) })
      return result
    } catch (err) {
      reply.send(err)
    }
  })
}

module.exports = routes
