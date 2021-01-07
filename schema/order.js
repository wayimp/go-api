const bookSchema = require('./book')

const orderSchema = {
  type: 'object',
  properties: {
    _id: { type: String, required: false },
    archived: {
      type: 'boolean'
    },
    date: {
      type: 'date-time'
    },
    customerName: {
      type: 'string'
    },
    customerStreet: {
      type: 'string'
    },
    customerCity: {
      type: 'string'
    },
    customerState: {
      type: 'string'
    },
    customerZip: {
      type: 'string'
    },
    customerPhone: {
      type: 'string'
    },
    customerEmail: {
      type: 'string'
    },
    notes: {
      type: 'string'
    },
    donation: {
      type: 'number'
    },
    books: {
      type: 'array',
      items: {
        bookSchema
      }
    }
  },
  required: ['customerName']
}
