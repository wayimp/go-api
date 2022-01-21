const moment = require('moment-timezone')
const dateFormat = 'YYYY-MM-DDTHH:mm:SS'
const { ObjectId } = require('mongodb')
const axios = require('axios')
const { validate, email, slack } = require('../notify')

async function routes (fastify, options) {
  const emailCollection = fastify.mongo.db.collection('email')

  fastify.post('/signup', {}, async function (request, reply) {
    // This is the email signup from the LRM site
    try {
      const { body } = request

      const created = await emailCollection.insertOne(body)

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

  fastify.post('/newsletter', {}, async function (request, reply) {
    // This is the email signup from the Go Therefore site
    try {
      const { body } = request

      const created = await emailCollection.insertOne({
        email: body.customerEmail,
        firstName: body.customerName
      })

      // Add this email to the BenchmarkEmail list
      // https://clientapi.benchmarkemail.com/Contact/18979047/ContactDetails

      const payload = {
        Data: {
          Email: body.customerEmail,
          FirstName: body.customerName,
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
