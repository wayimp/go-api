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

  fastify.post('/donation', async (req, res) => {
    const { amount, orderId, email } = req.body

    const sessionToCreate = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Go Therefore Ministries Donation'
            },
            unit_amount: amount
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: orderId
        ? `https://lifereferencemanual.net/order/${orderId}?sc=dr`
        : 'https://lifereferencemanual.net',
      cancel_url: orderId
        ? `https://lifereferencemanual.net/order/${orderId}`
        : 'https://lifereferencemanual.net'
    }

    const expression = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i
    const emailValid = expression.test(String(email).toLowerCase())
    if (emailValid) {
      sessionToCreate.customer_email = email
    }

    const session = await stripe.checkout.sessions.create(sessionToCreate)

    res.send({
      sessionId: session.id
    })
  })

  fastify.post('/intent', async (req, res) => {
    const { amount, orderId, email } = req.body

    const intentToCreate = {
      amount,
      currency: 'usd'
    }

    const paymentIntent = await stripe.paymentIntents.create(intentToCreate)

    const expression = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i
    const emailValid = expression.test(String(email).toLowerCase())
    if (emailValid) {
      sessionToCreate.customer_email = email
    }

    res.send({
      sessionId: session.id
    })
  })

  fastify.post('/subscriptions', { schema: updateOneSub }, async function (
    request,
    reply
  ) {
    const { priceId } = request.body

    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        success_url: 'https://lifereferencemanual.net',
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
