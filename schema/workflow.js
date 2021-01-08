const workflowSchema = {
  type: 'object',
  properties: {
    _id: { type: String, required: false },
    order: { type: Number, required: false },
    action: { type: String, required: true }
  }
}
