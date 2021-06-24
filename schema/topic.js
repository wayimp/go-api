const sectionSchema = require('./section')

const topicSchema = {
  type: 'object',
  properties: {
    _id: { type: String, required: false },
    active: {
      type: 'boolean'
    },
    order: { type: Number, required: false },
    category: { type: String, required: true },
    title: { type: String, required: true },
    sections: {
      type: 'array',
      items: {
        sectionSchema
      }
    }
  }
}
