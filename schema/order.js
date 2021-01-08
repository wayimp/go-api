const bookSchema = require('./book')

const timelineSchema = {
  type: 'object',
  properties: {
    action: {
       type: 'string'
    },
    timestamp: {
       type: 'date-time'
    }
  }
}

const orderSchema = {
  type: 'object',
  properties: {
    _id: { type: String, required: false },
    archived: {
      type: 'boolean'
    },
    created: {
      type: 'date-time'
    },
    modified: {
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
    },
    timeline: {
      type: 'array',
      items: {
        timelineSchema
      }
    }
  },
  required: ['customerName']
}
