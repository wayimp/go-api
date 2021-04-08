const customerSchema = require('../schema/customer')
const { getOAuthClient, getOAuthClientBare } = require('../intuit')
const OAuthClient = require('intuit-oauth')
const { validate } = require('../notify')

const updateOne = {
  body: {
    customerSchema
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

const makeid = length => {
  var result = ''
  var characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  var charactersLength = characters.length
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

async function routes (fastify, options) {
  const jwt = fastify.jwt
  const settingsCollection = fastify.mongo.db.collection('settings')
  const customersCollection = fastify.mongo.db.collection('customers')

  fastify.get('/getAuthUri', async (req, res) => {
    const oauthClient = await getOAuthClientBare()

    const callbackId = makeid(10)

    const authUri = oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting],
      state: callbackId
    })

    res.send({ authUri })
  })

  fastify.get('/callback', async (req, res) => {
    try {
      const oauthClient = await getOAuthClientBare()
      const { url } = req

      oauthClient.createToken(url).then(function (authResponse) {
        const { token } = authResponse
        const { access_token, refresh_token } = token

        settingsCollection.updateOne(
          {
            name: 'access_token'
          },
          {
            $set: {
              value: access_token
            }
          }
        )

        settingsCollection.updateOne(
          {
            name: 'refresh_token'
          },
          {
            $set: {
              value: refresh_token
            }
          }
        )
      })
    } catch (err) {
      settingsCollection.insertOne({
        name: 'routine_error',
        value: JSON.stringify(err)
      })
    }
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

      const oauthClient = await getOAuthClient(settingsCollection)
      const companyID = process.env.INTUIT_REALM_ID
      const url = process.env.INTUIT_URL

      if (oauthClient.isAccessTokenValid()) {
        await customersCollection.deleteMany({})

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
      }
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

      const newCustomer = request.body
      if (!validate(newCustomer.PrimaryEmailAddr.Address)) {
        delete newCustomer.PrimaryEmailAddr
      }

      oauthClient
        .makeApiCall({
          url: `https://${url}/v3/company/${companyID}/customer?minorversion=14`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: newCustomer
        })
        .then(function (response) {
          if (response && response.json && response.json.Customer) {
            customersCollection.insertOne(response.json.Customer)
          }
          reply.send(JSON.stringify(response.json.Customer))
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
