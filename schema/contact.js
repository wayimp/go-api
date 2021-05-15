const workflowSchema = require('./workflow')

const contactSchema = {
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
    customerId: {
      type: 'string'
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
    timeline: {
      type: 'array',
      items: {
        workflowSchema
      }
    }
  },
  required: ['customerName']
}
