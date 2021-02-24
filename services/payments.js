const moment = require('moment-timezone')
const dateFormat = 'YYYY-MM-DDTHH:mm:SS'
const { ObjectId } = require('mongodb')
const { validate, email, slack } = require('../notify')
const { stripe } = require('../stripeOps')
const paymentSchema = require('../schema/payment')
const subscriptionSchema = require('../schema/subscription')

const updateOne = {
  body: {
    paymentSchema
  }
}

const updateOneSub = {
  body: {
    subscriptionSchema
  }
}

async function routes (fastify, options) {
  fastify.get('/stripe-key', (req, res) => {
    res.send({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY })
  })

  fastify.post('/payments', { schema: updateOne }, async function (
    request,
    reply
  ) {
    const { paymentMethodId, paymentIntentId, amount } = request.body

    try {
      let intent
      if (paymentMethodId) {
        // Create new PaymentIntent with a PaymentMethod ID from the client.
        intent = await stripe.paymentIntents.create({
          amount,
          currency: 'usd',
          payment_method: paymentMethodId,
          confirmation_method: 'manual',
          confirm: true
        })
        // After create, if the PaymentIntent's status is succeeded, fulfill the order.
      } else if (paymentIntentId) {
        // Confirm the PaymentIntent to finalize payment after handling a required action
        // on the client.
        intent = await stripe.paymentIntents.confirm(paymentIntentId)
        // After confirm, if the PaymentIntent's status is succeeded, fulfill the order.
      }
      reply.send(generateResponse(intent))
    } catch (e) {
      // Handle "hard declines" e.g. insufficient funds, expired card, etc
      // See https://stripe.com/docs/declines/codes for more
      reply.send({ error: e.message })
    }
  })

  fastify.post('/subscriptions', { schema: updateOneSub }, async function (
    request,
    reply
  ) {
    const { priceId } = request.body

    // See https://stripe.com/docs/api/checkout/sessions/create
    // for additional parameters to pass.
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            // For metered billing, do not pass quantity
            quantity: 1
          }
        ],
        // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
        // the actual Session ID is returned in the query parameter when your customer
        // is redirected to the success page.
        success_url:
          'https://lifereferencemanual.net?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://lifereferencemanual.net'
      })

      reply.send({
        sessionId: session.id
      })
    } catch (e) {
      reply.status(400)
      return reply.send({
        error: {
          message: e.message
        }
      })
    }
  })
}

module.exports = routes
