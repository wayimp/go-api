const verseSchema = require('../schema/verse')
const { ObjectId } = require('mongodb')

const single = {
  schema: {
    response: {
      200: { verseSchema }
    }
  }
}

const multiple = {
  200: {
    description: 'verses',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        result: { verseSchema }
      }
    }
  }
}

async function routes (fastify, options) {
  const versesCollection = fastify.mongo.db.collection('verses')

  fastify.get('/verses/:version/:ref', multiple, async (request, reply) => {
    try {
      const { version, ref } = request.params

      // example format: GEN.1.1-2
      const parts = ref.split('.')
      const verseRange = parts[2].split('-')

      const matchQuery = {
        version,
        book: parts[0],
        chapter: Number(parts[1]),
        verse: !parts[2].includes('-')
          ? Number(parts[2])
          : { $gte: Number(verseRange[0]), $lte: Number(verseRange[1]) }
      }

      const result = versesCollection
        .find(matchQuery)
        .sort([['verse', 1]])
        .toArray()

      return result
    } catch (err) {
      reply.send(err)
    }
  })
}

module.exports = routes
