const customerSchema = require('../schema/customer')
const invoiceSchema = require('../schema/invoice')
const { getOAuthClient } = require('../intuit')
const OAuthClient = require('intuit-oauth')

const updateOne = {
  body: {
    customerSchema
  }
}

const updateInvoice = {
  body: {
    invoiceSchema
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
      200: { customerSchema }
    }
  }
}

const multiple = {
  200: {
    description: 'customers',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        result: { customerSchema }
      }
    }
  }
}

async function routes (fastify, options) {
  const jwt = fastify.jwt
  const settingsCollection = fastify.mongo.db.collection('settings')
  const customersCollection = fastify.mongo.db.collection('customers')

  fastify.get('/customers', multiple, async (request, reply) => {
    try {
      await request.jwtVerify()

      const result = customersCollection
        .find({})
        .sort([
          ['FamilyName', 1],
          ['GivenName', 1]
        ])
        .project({
          _id: 0
        })
        .toArray()

      return result
    } catch (err) {
      reply.send(err)
    }
  })

  // This syncs the database collection
  fastify.delete('/customers', multiple, async (request, reply) => {
    try {
      await request.jwtVerify()

      await customersCollection.deleteMany({})

      const oauthClient = await getOAuthClient(settingsCollection)

      const companyID = process.env.INTUIT_REALM_ID
      const url = process.env.INTUIT_URL

      oauthClient
        .makeApiCall({
          url: `https://${url}/v3/company/${companyID}/query?minorversion=14`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/text'
          },
          body: 'Select * from Customer'
        })
        .then(function (response) {
          customersCollection.insertMany(response.json.QueryResponse.Customer)
          reply.send()
        })
        .catch(function (e) {
          console.log('The error is ' + JSON.stringify(e))
          reply.send(e)
        })
    } catch (err) {
      reply.send(err)
    }
  })

  fastify.patch('/customers', { schema: updateOne }, async function (
    request,
    reply
  ) {
    try {
      await request.jwtVerify()

      const oauthClient = await getOAuthClient(settingsCollection)

      const companyID = process.env.INTUIT_REALM_ID
      const url = process.env.INTUIT_URL

      oauthClient
        .makeApiCall({
          url: `https://${url}/v3/company/${companyID}/customer?minorversion=14`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: request.body
        })
        .then(function (response) {
          reply.send(response.json.QueryResponse)
        })
        .catch(function (e) {
          console.log('The error is ' + JSON.stringify(e))
          reply.send(e)
        })
    } catch (err) {
      reply.send(err)
    }
  })

  fastify.patch('/invoice', { schema: updateInvoice }, async function (
    request,
    reply
  ) {
    try {
      await request.jwtVerify()

      const oauthClient = await getOAuthClient(settingsCollection)

      const companyID = process.env.INTUIT_REALM_ID
      const url = process.env.INTUIT_URL

      oauthClient
        .makeApiCall({
          url: `https://${url}/v3/company/${companyID}/invoice?minorversion=14`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: request.body
        })
        .then(function (response) {
          reply.send(response.json.QueryResponse)
        })
        .catch(function (e) {
          console.log('The error is ' + JSON.stringify(e))
          reply.send(e)
        })
    } catch (err) {
      reply.send(err)
    }
  })
}

module.exports = routes