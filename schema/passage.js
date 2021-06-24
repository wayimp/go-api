const passageSchema = {
  type: 'object',
  properties: {
    id: { type: String, required: false },
    type: { type: String, required: false },
    label: { type: String, required: false },
    apiKey: { type: String, required: false },
    version: { type: String, required: false },
    html: { type: String, required: false },
    passageId: { type: String, required: false },
    bibleId: { type: String, required: false },
    reference: { type: String, required: false }
  }
}
