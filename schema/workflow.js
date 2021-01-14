const workflowSchema = {
  type: 'object',
  properties: {
    _id: { type: String, required: false },
    order: { type: Number, required: false },
    action: { type: String, required: true },
    timestamp: {
      type: 'date-time'
    },
    state: { type: Number, required: false },
    fields: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: {
            type: 'string'
          },
          inputType: {
            type: 'string'
          },
          value: {
            type: 'string'
          }
        }
      }
    }
  }
}
