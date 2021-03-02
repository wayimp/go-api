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

  fastify.get('/getAuthUri', async (req, res) => {
    const oauthClient = await getOAuthClient(settingsCollection)

    const authUri = oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
      state: 'authorizeMe'
    })
    res.send({ authUri })
  })

  fastify.get('/callback', (req, res) => {
    let parseRedirect = req.url

    oauthClient
      .createToken(parseRedirect)
      .then(function (authResponse) {
        const token = authResponse.getJson()
        const { refresh_token } = token

        const updated = settingsCollection.updateOne(
          {
            _id: ObjectId('602abb51f760989163928728')
          },
          {
            $set: {
              name: 'refresh_token',
              hidden: true,
              value: refresh_token
            }
          },
          { upsert: true }
        )
      })
      .catch(function (e) {
        console.error('The error message is :' + e.originalMessage)
        console.error(e.intuit_tid)
      })
  })

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

      const getCustomers = async pageNo => {
        oauthClient
          .makeApiCall({
            url: `https://${url}/v3/company/${companyID}/query?minorversion=14`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/text'
            },
            body: `Select * from Customer startposition ${pageNo * 1000 +
              1} maxresults 1000`
          })
          .then(function (response) {
            const customers = response.json.QueryResponse.Customer.map(
              customer => (customer.FamilyName ? customer : null)
            ).filter(noNull => noNull)
            customersCollection.insertMany(customers)
          })
      }

      oauthClient
        .makeApiCall({
          url: `https://${url}/v3/company/${companyID}/query?minorversion=14`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/text'
          },
          body: 'Select Count(*) from Customer'
        })
        .then(async response => {
          const { totalCount } = response.json.QueryResponse
          const iterations = Math.floor(Number(totalCount) / 1000)
          for (let i = 0; i <= iterations; i++) {
            await getCustomers(i)
          }
          reply.send(totalCount)
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
