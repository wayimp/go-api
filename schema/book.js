const bookSchema = {
  type: 'object',
  properties: {
    _id: { type: String, required: false },
    active: {
      type: 'boolean'
    },
    order: {
      type: 'number'
    },
    title: {
      type: 'string'
    },
    image: {
      type: 'string'
    },
    numberRequested: {
      type: 'number'
    },
    numberShipped: {
      type: 'number'
    }
  },
  required: ['title']
}
