const blockSchema = {
  type: 'object',
  properties: {
    _id: { type: String, required: false },
    active: {
      type: 'boolean'
    },
    order: { type: Number, required: false },
    type: { type: String, required: false },
    description: { type: String, required: false },
    category: { type: String, required: true },
    html: { type: String, required: true }
  }
}
