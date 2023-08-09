const moment = require('moment-timezone')
const dateFormat = 'YYYY-MM-DDTHH:mm:SS'
const { ObjectId } = require('mongodb')
const axios = require('axios')
const { validate, email } = require('../notify')
const Readable = require('stream').Readable

async function routes(fastify, options) {
  const ordersCollection = fastify.mongo.db.collection('orders')
  const emailCollection = fastify.mongo.db.collection('email')

  fastify.post('/signup', {}, async function (request, reply) {
    // This is the email signup from the LRM site
    try {
      const { body } = request

      const created = await emailCollection.insertOne(body)

      // Add this email to the BenchmarkEmail list
      // https://clientapi.benchmarkemail.com/Contact/18979047/ContactDetails
      /*
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
      */
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

      /*
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
      */

      return created
    } catch (err) {
      reply.send(err)
    }
  })

  fastify.get('/emails', {}, async (request, reply) => {
    try {

      await request.jwtVerify()

      const emailRaw = await emailCollection
        .find({})
        .toArray()

      const emailCSV = emailRaw
        .map(email => {
          return email
            ? `${email.firstName ? email.firstName : ''} ${email.lastName ? email.lastName : ''},${email.email}`.replace(/\s\s+/g, ' ')
            : null
        })
        .filter(noNull => noNull)

      const ordersRaw = await ordersCollection
        .find({
          'newsletter': true
        })
        .toArray()

      const ordersCSV = ordersRaw
        .map(email => {
          return email
            ? `${email.customerName},${email.customerEmail}`.replace(/\s\s+/g, ' ')
            : null
        })
        .filter(noNull => noNull)

      const union = [...new Set([...emailCSV, ...ordersCSV])];

      const stream = new Readable()
      stream.push(union.join('\n'))    // the string you want
      stream.push(null)

      return reply.type('text/csv').send(stream)

    } catch (err) {
      reply.send(err)
    }
  })

}
module.exports = routes
