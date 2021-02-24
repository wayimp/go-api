const dotenv = require('dotenv')

let stripePublishableKey, stripeSecretKey
if (process.env.STRIPE_SECRET_KEY) {
  stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY
  stripeSecretKey = process.env.STRIPE_SECRET_KEY
} else {
  // Load the config if it has not been done
  const env = dotenv.config()
  stripePublishableKey = env.parsed.STRIPE_PUBLISHABLE_KEY
  stripeSecretKey = env.parsed.STRIPE_SECRET_KEY
}

const stripe = require('stripe')(stripeSecretKey)

module.exports = {
  stripe
}