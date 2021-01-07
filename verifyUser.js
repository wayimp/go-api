function verifyUser (request, reply, done) {
  const usersCollection = this.mongo.db.collection('users')

  if (!request.body || !request.body.user) {
    return done(new Error('Missing user in request body'))
  }

  console.log('verifyUser called')

  usersCollection
    .find({
      user: request.body.user
    })
    .toArray()
    .then(result => {
      console.log(result)
      done()
    })
}
