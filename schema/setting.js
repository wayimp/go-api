const settingSchema = {
  type: 'object',
  properties: {
    _id: { type: String, required: false },
    public: { type: 'boolean', required: false },
    hidden: { type: 'boolean', required: false },
    name: { type: String, required: true },
    value: { type: String, required: false },
    description: { type: String, required: false },
    details: { type: String, required: false }
  }
}
