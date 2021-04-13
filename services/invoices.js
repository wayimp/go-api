const invoiceSchema = require('../schema/invoice')
const { getOAuthClient, getOAuthClientBare } = require('../intuit')
const OAuthClient = require('intuit-oauth')

const updateOne = {
  body: {
    invoiceSchema
  }
}

const single = {
  schema: {
    response: {
      200: { invoiceSchema }
    }
  }
}

const multiple = {
  200: {
    description: 'invoices',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        result: { invoiceSchema }
      }
    }
  }
}

async function routes (fastify, options) {
  const jwt = fastify.jwt
  const settingsCollection = fastify.mongo.db.collection('settings')
  const invoicesCollection = fastify.mongo.db.collection('invoices')

  fastify.get('/invoices', multiple, async (request, reply) => {
    try {
      await request.jwtVerify()

      const { query } = request

      const { page } = query

      if (!page) {
        page = 0
      }

      const findParams = {}

      if (query.search) {
        findParams.$or = [
          { customerName: { $regex: query.search, $options: 'i' } },
          { customerStreet: { $regex: query.search, $options: 'i' } },
          { customerCity: { $regex: query.search, $options: 'i' } },
          { customerState: { $regex: query.search, $options: 'i' } },
          { customerZip: { $regex: query.search, $options: 'i' } },
          { customerPhone: { $regex: query.search, $options: 'i' } },
          { customerEmail: { $regex: query.search, $options: 'i' } }
        ]
      }

      const pipeline = [
        {
          $unwind: {
            path: '$Line',
            preserveNullAndEmptyArrays: false
          }
        },
        {
          $match: {
            'Line.SalesItemLineDetail.ItemRef.name': {
              $regex: new RegExp('^Bible')
            }
          }
        },
        {
          $group: {
            _id: '$CustomerRef.name',
            totalDonations: {
              $sum: '$TotalAmt'
            },
            totalBibles: {
              $sum: '$Line.SalesItemLineDetail.Qty'
            },
            recent: {
              $max: '$DueDate'
            },
            bibles: {
              $push: '$Line'
            },
            customerId: {
              $max: '$CustomerRef.value'
            },
            customerName: {
              $max: '$CustomerRef.name'
            },
            customerStreet: {
              $max: '$BillAddr.Line1'
            },
            customerCity: {
              $max: '$BillAddr.City'
            },
            customerState: {
              $max: '$BillAddr.CountrySubDivisionCode'
            },
            customerZip: {
              $max: '$BillAddr.PostalCode'
            }
          }
        },
        {
          $sort: {
            totalDonations: -1
          }
        },
        { $skip: page * 20 },
        { $limit: 20 }
      ]

      const invoices = await invoicesCollection.aggregate(pipeline).toArray()

      const numbered = invoices.map((invoice, index) => ({
        ...invoice,
        id: index
      }))

      return numbered
    } catch (err) {
      reply.send(err)
    }
  })

  // This syncs the database collection
  fastify.delete('/invoices', multiple, async (request, reply) => {
    try {
      await request.jwtVerify()
      const oauthClient = await getOAuthClient(settingsCollection)
      const companyID = process.env.INTUIT_REALM_ID
      const url = process.env.INTUIT_URL

      if (oauthClient.isAccessTokenValid()) {
        await invoicesCollection.deleteMany({})

        const getInvoices = async pageNo => {
          oauthClient
            .makeApiCall({
              url: `https://${url}/v3/company/${companyID}/query?minorversion=14`,
              method: 'POST',
              headers: {
                'Content-Type': 'application/text'
              },
              body: `Select * from Invoice startposition ${pageNo * 1000 +
                1} maxresults 1000`
            })
            .then(function (response) {
              const invoices = response.json.QueryResponse.Invoice.map(
                invoice => (invoice.CustomerRef.name ? invoice : null)
              ).filter(noNull => noNull)
              invoicesCollection.insertMany(invoices)
            })
        }

        oauthClient
          .makeApiCall({
            url: `https://${url}/v3/company/${companyID}/query?minorversion=14`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/text'
            },
            body: 'Select Count(*) from Invoice'
          })
          .then(async response => {
            const { totalCount } = response.json.QueryResponse
            const iterations = Math.floor(Number(totalCount) / 1000)
            for (let i = 0; i <= iterations; i++) {
              await getInvoices(i)
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

  fastify.patch('/invoice', { schema: updateOne }, async function (
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
          reply.send(response.json)
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
