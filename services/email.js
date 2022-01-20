const moment = require('moment-timezone')
const dateFormat = 'YYYY-MM-DDTHH:mm:SS'
const { ObjectId } = require('mongodb')
const axios = require('axios')
const { validate, email, slack } = require('../notify')

async function routes (fastify, options) {
  const emailCollection = fastify.mongo.db.collection('email')

  fastify.post('/signup', {}, async function (request, reply) {
    try {
      const { body } = request

      const created = await emailCollection.insertOne(body)

      if (body.body) {
        email(
          '',
          'keith@waysideimpressions.org',
          `Contact Message from ${body.name} <${body.email}>`,
          body.body
        )
      }

      // Add this email to the BenchmarkEmail list
      // https://clientapi.benchmarkemail.com/Contact/18979047/ContactDetails

      const payload = {
        Data: {
          Email: body.email,
          FirstName: body.firstName,
          LastName: body.lastName,
          EmailPerm: 1
        }
      }

      axios({
        method: 'post',
        url:
          'https://clientapi.benchmarkemail.com/Contact/18979047/ContactDetails',
        data: payload,
        headers: {
          AuthToken: 'E664B17F-443B-401C-9576-408C0EE104EB',
          'Content-Type': 'application/json'
        }
      })

      return created
    } catch (err) {
      reply.send(err)
    }
  })
}

module.exports = routes
