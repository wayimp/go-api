const productSchema = require('./product')
const workflowSchema = require('./workflow')

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
    customerCompany: {
      type: 'string'
    },
    instructions: {
      type: 'string'
    },
    notes: {
      type: 'string'
    },
    donation: {
      type: 'number'
    },
    products: {
      type: 'array',
      items: {
        productSchema
      }
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
