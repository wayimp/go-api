const dotenv = require('dotenv')
const { ObjectId } = require('mongodb')
const OAuthClient = require('intuit-oauth');

const getOAuthClient = async settingsCollection => {
  let clientId, clientSecret, environment
  if (process.env.INTUIT_CLIENT_ID) {
    clientId = process.env.INTUIT_CLIENT_ID
    clientSecret = process.env.INTUIT_CLIENT_SECRET
    environment = process.env.INTUIT_ENVIRONMENT
  } else {
    // Load the config if it has not been done
    const env = dotenv.config()
    clientId = env.parsed.INTUIT_CLIENT_ID
    clientSecret = env.parsed.INTUIT_CLIENT_SECRET
    environment = env.parsed.INTUIT_ENVIRONMENT
  }

  const oauthClient = new OAuthClient({
    clientId,
    clientSecret,
    environment,
    redirectUri: 'https://lifereferencemanual.net/callback'
  })

  if (!oauthClient.isAccessTokenValid()) {
    const tokenSetting = await settingsCollection.findOne({
      name: 'refresh_token'
    })

    const authResponse = await oauthClient.refreshUsingToken(tokenSetting.value)

    console.log('authResponse:' + JSON.stringify(authResponse))

    if (authResponse && authResponse.refresh_token) {
      console.log('refresh_token:' + authResponse.refresh_token)
      tokenSetting.value = authResponse.refresh_token
      await settingsCollection.updateOne(
        {
          _id: ObjectId(tokenSetting._id)
        },
        { $set: tokenSetting }
      )
    }
  }

  return oauthClient
}

module.exports = {
  getOAuthClient
}
