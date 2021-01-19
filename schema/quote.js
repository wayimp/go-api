const quoteSchema = {
  type: 'object',
  properties: {
    _id: { type: String, required: false },
    order: { type: Number, required: false },
    text: { type: String, required: true },
    author: { type: String, required: false },
    location: { type: String, required: false }
  }
}
