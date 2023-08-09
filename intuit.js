const dotenv = require('dotenv')
const { ObjectId } = require('mongodb')
const OAuthClient = require('intuit-oauth')

const getOAuthUri = async settingsCollection => {
  let clientId, clientSecret, environment, authUri

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

  try {
    const oauthClient = new OAuthClient({
      clientId,
      clientSecret,
      environment,
      redirectUri: 'https://api.gothereforeministries.org/callback'
    })

    authUri = oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.Payment],
      state: 'authorizeMe'
    })
  } catch (err) {
    console.log(err)
  }

  return authUri
}

const getOAuthClientBare = async () => {
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
    redirectUri: 'https://api.gothereforeministries.org/callback'
  })

  return oauthClient
}

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

  const accessToken = await settingsCollection.findOne({
    name: 'access_token'
  })

  const oauthClient = new OAuthClient({
    clientId,
    clientSecret,
    environment,
    redirectUri: 'https://api.gothereforeministries.org/callback',
    token: accessToken.value
  })

  if (!oauthClient.isAccessTokenValid()) {
    const refreshToken = await settingsCollection.findOne({
      name: 'refresh_token'
    })

    const authResponse = await oauthClient.refreshUsingToken(refreshToken.value)

    //console.log('authResponse:' + JSON.stringify(authResponse))

    if (authResponse && authResponse.refresh_token) {
      // console.log('refresh_token:' + authResponse.refresh_token)
      accessToken.value = authResponse.access_token
      await settingsCollection.updateOne(
        {
          _id: new ObjectId(accessToken._id)
        },
        { $set: accessToken }
      )

      refreshToken.value = authResponse.refresh_token
      await settingsCollection.updateOne(
        {
          _id: new ObjectId(refreshToken._id)
        },
        { $set: refreshToken }
      )
    }
  }

  return oauthClient
}

module.exports = {
  getOAuthClient,
  getOAuthClientBare
}
