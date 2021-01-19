const orderSchema = require('../schema/order')
const moment = require('moment-timezone')
const dateFormat = 'YYYY-MM-DDTHH:mm:SS'
const { ObjectId } = require('mongodb')
const { validate, email, slack } = require('../notify')
const { pdfGen } = require('../pdf/pdfGen')

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

async function routes (fastify, options) {
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
    created.id = created.ops[0]._id

    const customerEmail = created.ops[0].customerEmail
    if (validate(customerEmail)) {
      const settingsArray = await settingsCollection.find({}).toArray()
      const settings = {}
      settingsArray.map(setting => {
        settings[setting.name] = setting.value
      })

      const link = `https://lifereferencemanual.net/order/${created.id}`
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
        _id: ObjectId(id)
      },
      { $set: body },
      { upsert: true }
    )

    return updated
  })

  fastify.get('/orders/:id', multiple, async (request, reply) => {
    const result = await ordersCollection.findOne({
      _id: ObjectId(request.params.id)
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

      const findParams = {
        archived: false
      }

      if (query.showInactive) {
        findParams.archived = true
      }

      if (query.search) {
        findParams.customerName = { $regex: query.search, $options: 'i' }
      }

      const result = ordersCollection
        .find(findParams)
        .sort([['date', -1]])
        .toArray()

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
      const result = await ordersCollection.deleteOne({ _id: ObjectId(id) })
      return result
    }
  )

  fastify.get('/pdf/:id', multiple, async (request, reply) => {
    const result = await ordersCollection.findOne({
      _id: ObjectId(request.params.id)
    })

    if (!result) {
      const err = new Error()
      err.statusCode = 400
      err.message = `id: ${id}.`
      throw err
    }

    const pdf = pdfGen(result)

    reply
      .code(200)
      .header('Content-Type', 'application/pdf')
      .send(pdf)
  })
}

module.exports = routes
