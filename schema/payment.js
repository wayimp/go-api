const paymentSchema = {
  type: 'object',
  properties: {
    _id: { type: String, required: false },
    amount: { type: Number, required: false },
    currency: { type: String, required: false },
    payment_method: { type: String, required: false },
    confirmation_method: 'manual',
    confirm: true
  }
}