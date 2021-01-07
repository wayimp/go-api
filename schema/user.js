const userSchema = {
  type: 'object',
  properties: {
    _id: { type: String, required: false },
    username: { type: String, required: true },
    password: { type: String, required: true },
    roles: { type: String, required: false }
  }
}