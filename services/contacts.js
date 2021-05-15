const contactSchema = require('../schema/contact')
const moment = require('moment-timezone')
const dateFormat = 'YYYY-MM-DDTHH:mm:SS'
const { ObjectId } = require('mongodb')
const { validate, email, slack } = require('../notify')

const updateOne = {
  body: {
    contactSchema
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
      200: { contactSchema }
    }
  }
}

const multiple = {
  200: {
    description: 'contacts',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        result: { contactSchema }
      }
    }
  }
}

async function routes (fastify, options) {
  const customersCollection = fastify.mongo.db.collection('customers')
  const contactsCollection = fastify.mongo.db.collection('contacts')
  const jwt = fastify.jwt

  fastify.patch('/contacts', { schema: updateOne }, async function (
    request,
    reply
  ) {
    await request.jwtVerify()

    const { body } = request
    body.modified = new Date(moment().tz('America/Chicago'))
    delete body._id

    const updated = await contactsCollection.updateOne(
      {
        customerId: body.customerId
      },
      { $set: body },
      { upsert: true }
    )

    console.log(body)

    return updated
  })

  fastify.get('/contacts/:id', multiple, async (request, reply) => {
    // Get the customer data
    const customer = await customersCollection.findOne({
      Id: request.params.id
    })

    if (!customer) {
      const err = new Error()
      err.statusCode = 400
      err.message = `id: ${id}.`
      throw err
    }

    const contact = {}
    contact.archived = false
    contact.created = new Date(moment().tz('America/Chicago'))
    contact.modified = new Date(moment().tz('America/Chicago'))
    contact.customerId = customer.Id
    contact.customerName = customer.PrintOnCheckName
    contact.customerStreet = customer.BillAddr.Line1
    contact.customerCity = customer.BillAddr.City
    contact.customerState = customer.BillAddr.CountrySubDivisionCode
    contact.customerZip = customer.BillAddr.PostalCode
    contact.customerPhone = customer.PrimaryPhone
      ? customer.PrimaryPhone.FreeFormNumber
      : ''
    contact.customerEmail = customer.PrimaryEmailAddr
      ? customer.PrimaryEmailAddr.Address
      : ''
    contact.notes = ''
    contact.donation = 0
    contact.timeline = []

    const inserted = await contactsCollection.insertOne(contact)

    return { ...contact, _id: inserted.insertedId }
  })

  fastify.get('/contacts', multiple, async (request, reply) => {
    try {
      const { query } = request

      const findParams = {
        active: true
      }

      if (query.showInactive) {
        delete findParams.active
      }

      const result = contactsCollection
        .find(findParams)
        .sort([['modified', -1]])
        .toArray()

      return result
    } catch (err) {
      reply.send(err)
    }
  })

  fastify.post('/contacts', { schema: updateOne }, async function (
    request,
    reply
  ) {
    await request.jwtVerify()

    const { body } = request

    const created = await contactsCollection.insertOne(body)
    created.id = created.ops[0]._id

    return created
  })

  fastify.delete(
    '/contacts/:id',
    { schema: deleteOne },
    async (request, reply) => {
      const {
        params: { id }
      } = request
      await request.jwtVerify()
      const result = await contactsCollection.deleteOne({ _id: ObjectId(id) })
      return result
    }
  )
}

module.exports = routes
