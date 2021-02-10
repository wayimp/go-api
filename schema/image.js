const imageSchema = {
  type: 'object',
  properties: {
    active: {
      type: 'boolean'
    },
    caption: {
      type: 'string'
    },
    url: {
      type: 'string'
    }
  },
  required: ['url']
}
