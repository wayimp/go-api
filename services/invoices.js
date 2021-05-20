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

      let { page, code, search, field, sort } = query

      if (!page) {
        page = 0
      }

      if (code && code.length > 0) {
        code = decodeURIComponent(code)
      }

      let matchParams = []

      if (search && search.length > 0) {
        matchParams = [
          { customerName: { $regex: search, $options: 'i' } },
          { customerCity: { $regex: search, $options: 'i' } },
          { customerState: { $regex: search, $options: 'i' } },
          { customerZip: { $regex: search, $options: 'i' } }
        ]
      }

      const pipeline = [
        {
          $unwind: {
            path: '$Line',
            preserveNullAndEmptyArrays: false
          }
        }
      ]

      if (code && code.length > 0) {
        if (code === 'ANY') {
          pipeline.push({
            $match: {
              'Line.SalesItemLineDetail.ItemRef.name': {
                $regex: new RegExp('^Bible')
              }
            }
          })
        } else {
          pipeline.push({
            $match: {
              'Line.SalesItemLineDetail.ItemRef.name': code
            }
          })
        }
      } else {
        pipeline.push({
          $match: {
            'Line.DetailType': 'SubTotalLineDetail'
          }
        })
      }

      pipeline.push({
        $group: {
          _id: '$CustomerRef.name',
          totalDonations: {
            $sum: '$TotalAmt'
          },
          totalBibles: {
            $sum: '$Line.SalesItemLineDetail.Qty'
          },
          recent: {
            $max: '$TxnDate'
          },
          bibles: {
            $push: {
              name: '$Line.SalesItemLineDetail.ItemRef.name',
              count: '$Line.SalesItemLineDetail.Qty'
            }
          },
          customerId: {
            $max: '$CustomerRef.value'
          },
          customerName: {
            $max: '$CustomerRef.name'
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
      })

      if (search && search.length > 0) {
        pipeline.push({
          $match: {
            $or: matchParams
          }
        })
      }

      pipeline.push({
        $count: 'customerName'
      })

      const count = await invoicesCollection.aggregate(pipeline).toArray()

      pipeline.pop() // Remove the count stage

      if (field && field.length > 0) {
        pipeline.push({
          $sort: {
            [field]: sort === 'asc' ? 1 : -1
          }
        })
      } else {
        pipeline.push({
          $sort: {
            totalDonations: -1
          }
        })
      }

      pipeline.push({ $skip: page * 20 })
      pipeline.push({ $limit: 20 })

      pipeline.push({
        $lookup: {
          from: 'contacts',
          localField: 'customerId',
          foreignField: 'customerId',
          as: 'Contacts'
        }
      })

      // console.log(pipeline)

      // It might max out the memory with the sort
      /*
      const result = await invoicesCollection
        .aggregate(pipeline, { allowDiskUse: true })
        .toArray()
      */

      const result = await invoicesCollection.aggregate(pipeline).toArray()

      const invoices = result.map((invoice, index) => ({
        ...invoice,
        id: index,
        bibles: summarize(invoice.bibles)
      }))

      return { invoices, count: count[0].customerName }
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

  const summarize = lines => {
    const summary = {}
    lines.map(line => {
      if (summary.hasOwnProperty(line.name)) {
        summary[line.name] += Number(line.count)
      } else {
        summary[line.name] = Number(line.count)
      }
    })
    return Object.entries(summary).sort((a, b) => b[1] - a[1])
  }

  fastify.get('/monthly', multiple, async (request, reply) => {
    try {
      //await request.jwtVerify()

      const { query } = request

      let { code } = query

      const donationsPipeline = [
        {
          $unwind: {
            path: '$Line',
            preserveNullAndEmptyArrays: false
          }
        },
        {
          $match: {
            'Line.DetailType': 'SubTotalLineDetail'
          }
        },
        {
          $group: {
            _id: {
              $substr: ['$TxnDate', 0, 7]
            },
            totalDonations: {
              $sum: '$TotalAmt'
            },
            outstandingBalance: {
              $sum: '$Balance'
            }
          }
        },
        { $sort: { _id: -1 } }
      ]

      const donations = await invoicesCollection
        .aggregate(donationsPipeline)
        .toArray()

      const biblePipeline = []

      biblePipeline.push({
        $unwind: {
          path: '$Line',
          preserveNullAndEmptyArrays: false
        }
      })

      if (code && code.length > 0) {
        code = decodeURIComponent(code)
        biblePipeline.push({
          $match: {
            'Line.SalesItemLineDetail.ItemRef.name': code
          }
        })
      } else {
        biblePipeline.push({
          $match: {
            'Line.SalesItemLineDetail.ItemRef.name': {
              $regex: new RegExp('^Bible')
            }
          }
        })
      }

      biblePipeline.push({
        $group: {
          _id: {
            $substr: ['$TxnDate', 0, 7]
          },
          totalBibles: {
            $sum: '$Line.SalesItemLineDetail.Qty'
          },
          bibles: {
            $push: {
              name: '$Line.SalesItemLineDetail.ItemRef.name',
              count: '$Line.SalesItemLineDetail.Qty'
            }
          }
        }
      })

      const bibles = await invoicesCollection.aggregate(biblePipeline).toArray()

      const result = donations.map(d => {
        const bible = bibles.find(b => b._id === d._id)

        return {
          id: d._id,
          totalDonations: Number(d.totalDonations),
          outstandingBalance: Number(d.outstandingBalance),
          totalBibles: bible ? Number(bible.totalBibles) : 0,
          bibles: bible ? summarize(bible.bibles) : []
        }
      })

      return result
    } catch (err) {
      reply.send(err)
    }
  })

  fastify.get('/yearly/:year/:minimum', multiple, async (request, reply) => {
    try {
      //await request.jwtVerify()

      const { year, minimum } = request.params
      const { query } = request

      const donationsPipeline = [
        {
          $match: {
            TxnDate: { $regex: `^${year}` }
          }
        },
        {
          $unwind: {
            path: '$Line',
            preserveNullAndEmptyArrays: false
          }
        },
        {
          $match: {
            'Line.DetailType': 'SubTotalLineDetail'
          }
        },
        {
          $group: {
            _id: '$CustomerRef.name',
            totalDonations: {
              $sum: '$TotalAmt'
            },
            customerId: {
              $max: '$CustomerRef.value'
            },
            customerName: {
              $max: '$CustomerRef.name'
            }
          }
        },
        {
          $sort: {
            totalDonations: -1
          }
        }
      ]

      const donations = await invoicesCollection
        .aggregate(donationsPipeline)
        .toArray()

      const biblesPipeline = [
        {
          $match: {
            TxnDate: { $regex: `^${year}` }
          }
        },
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
            totalBibles: {
              $sum: '$Line.SalesItemLineDetail.Qty'
            },
            customerId: {
              $max: '$CustomerRef.value'
            }
          }
        }
      ]

      const bibles = await invoicesCollection
        .aggregate(biblesPipeline)
        .toArray()

      const getTotalBibles = customerId => {
        const total = bibles.find(b => b.customerId === customerId)
        return total ? total.totalBibles : 0
      }

      const totals = donations.map(m => ({
        ...m,
        id: m._id,
        totalBibles: getTotalBibles(m.customerId)
      }))

      // Only send them a letter if they donated more than they received
      const netDonors = totals.filter(
        entry => entry.totalDonations - entry.totalBibles > minimum
      )

      /*
      const netDonorIds = netDonors.map(d => d.customerId)

      const addresses = await customersCollection
        .find({ Id: { $in: netDonorIds } })
        .toArray()

      const result = netDonors
        .map(entry => {
          const address = addresses.find(f => f.Id === entry.customerId)
          if (address) {
            return {
              ...entry,
              customerStreet: address.BillAddr.Line1,
              customerCity: address.BillAddr.City,
              customerState: address.BillAddr.CountrySubDivisionCode,
              customerZip: address.BillAddr.PostalCode
            }
          }
        })
        .filter(noNull => noNull)
*/

      return netDonors
    } catch (err) {
      reply.send(err)
    }
  })
}

module.exports = routes
