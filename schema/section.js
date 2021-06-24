const passageSchema = require('./passage')

const sectionSchema = {
  type: 'object',
  properties: {
    version: { type: String, required: false },
    name: { type: String, required: false },
    tags: {
      type: 'array',
      items: { type: String, required: false }
    },
    items: {
      type: 'array',
      items: {
        passageSchema
      }
    }
  }
}
