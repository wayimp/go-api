const verseSchema = {
  type: 'object',
  properties: {
    id: { type: String, required: false },
    version: { type: String, required: true },
    book: { type: String, required: true },
    chapter: { type: Number, required: true },
    verse: { type: Number, required: true },
    text: { type: String, required: false }
  }
}
