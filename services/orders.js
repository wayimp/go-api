const orderSchema = require('../schema/order')
const moment = require('moment-timezone')
const dateFormat = 'YYYY-MM-DDTHH:mm:SS'
const { ObjectId } = require('mongodb')
const { validate, email, slack } = require('../notify')
const { uploadBackup } = require('../spaces')
const axios = require('axios')

const updateOne = {
  body: {
    orderSchema
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
      200: { orderSchema }
    }
  }
}

const multiple = {
  200: {
    description: 'orders',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        result: { orderSchema }
      }
    }
  }
}

async function routes(fastify, options) {
  const ordersCollection = fastify.mongo.db.collection('orders')
  const settingsCollection = fastify.mongo.db.collection('settings')
  const jwt = fastify.jwt

  fastify.post('/orders', { schema: updateOne }, async function (
    request,
    reply
  ) {
    const { body } = request
    body.archived = false
    body.created = new Date(moment().tz('America/Chicago'))
    body.timeline = [
      {
        action: 'Submitted',
        timestamp: new Date(moment().tz('America/Chicago')),
        status: 1
      }
    ]

    const created = await ordersCollection.insertOne(body)
    console.log(JSON.stringify(created))
    if (created?.insertedId) {
      created.id = created.insertedId
    }

    const customerEmail = created.customerEmail
    if (validate(customerEmail)) {
      const settingsArray = await settingsCollection.find({}).toArray()
      const settings = {}
      settingsArray.map(setting => {
        settings[setting.name] = setting.value
      })

      const link = `https://gothereforeministries.org/order/${created.id}`
      const order_confirmation_body = settings.order_confirmation_body.replace(
        '[link]',
        link
      )

      email(
        customerEmail,
        settings.order_confirmation_subject,
        order_confirmation_body
      )
      const order_notification_body = settings.order_notification_body.replace(
        '[link]',
        link
      )
      email(
        settings.notification_emails,
        settings.order_notification_subject,
        order_notification_body
      )

      if (body.newsletter) {
        // Add this email to the BenchmarkEmail list
        // https://clientapi.benchmarkemail.com/Contact/18979047/ContactDetails

        const payload = {
          Data: {
            Email: customerEmail,
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
      }
    }

    return created
  })

  fastify.patch('/orders', { schema: updateOne }, async function (
    request,
    reply
  ) {
    const { body } = request
    body.modified = new Date(moment().tz('America/Chicago'))
    const id = body._id
    delete body._id

    const updated = await ordersCollection.updateOne(
      {
        _id: new ObjectId(id)
      },
      { $set: body },
      { upsert: true }
    )

    return updated
  })

  fastify.get('/orders/:id', multiple, async (request, reply) => {
    const result = await ordersCollection.findOne({
      _id: new ObjectId(request.params.id)
    })

    if (!result) {
      const err = new Error()
      err.statusCode = 400
      err.message = `id: ${id}.`
      throw err
    }

    return result
  })

  fastify.get('/orders', multiple, async (request, reply) => {
    try {
      await request.jwtVerify()

      const { user, query } = request

      let pageNo = 1
      let pageSize = 30

      if (query.pageNo) {
        pageNo = query.pageNo
      }

      if (query.pageSize) {
        pageSize = query.pageSize
      }

      const findParams = {
        archived: false
      }

      if (query.showInactive) {
        findParams.archived = true
      }

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
          $match: findParams
        },
        {
          $addFields: {
            _created: {
              $toDate: '$created'
            }
          }
        },
        {
          $sort: {
            _created: -1
          }
        },
        {
          $skip: (pageNo - 1) * pageSize
        },
        {
          $limit: pageSize
        }
      ]

      const result = ordersCollection.aggregate(pipeline).toArray()

      return result
    } catch (err) {
      reply.send(err)
    }
  })

  fastify.delete(
    '/orders/:id',
    { schema: deleteOne },
    async (request, reply) => {
      const {
        params: { id }
      } = request
      await request.jwtVerify()
      const result = await ordersCollection.deleteOne({ _id: new ObjectId(id) })
      return result
    }
  )

  fastify.get('/backup', async (req, res) => {
    const backup = await ordersCollection
      .find({
        archived: false
      })
      .sort([['date', -1]])
      .toArray()

    const log = `${backup.length} order records saved`

    uploadBackup(backup).then(res.send(log))
  })
}

module.exports = routes
