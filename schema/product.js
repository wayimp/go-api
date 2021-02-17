const productSchema = {
  type: 'object',
  properties: {
    _id: { type: String, required: false },
    active: {
      type: 'boolean'
    },
    order: {
      type: 'number'
    },
    category: {
      type: 'string'
    },
    title: {
      type: 'string'
    },
    image: {
      type: 'string'
    },
    quantity: {
      type: 'number'
    },
    limited: {
      type: 'boolean'
    }
  },
  required: ['title']
}
