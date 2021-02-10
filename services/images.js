const imageSchema = require('../schema/image')
const moment = require('moment-timezone')
const dateFormat = 'YYYY-MM-DDTHH:mm:SS'
const { ObjectId } = require('mongodb')
const { getFileList, uploadFile } = require('../spaces')

const updateOne = {
  body: {
    imageSchema
  }
}

const deleteOne = {
  response: {
    200: {}
  }
}

const single = {
  schema: {
    response: {
      200: { imageSchema }
    }
  }
}

const multiple = {
  200: {
    description: 'images',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        result: { imageSchema }
      }
    }
  }
}

async function routes (fastify, options) {
  const jwt = fastify.jwt

  fastify.get('/images', multiple, async (request, reply) => {
    try {
      const directory = 'go/'
      const fileList = await getFileList(directory)
      const result = fileList.slice(1).map((file, fi) => {
        return {
          src: `https://files.lifereferencemanual.net/${file}`
        }
      })

      return { result }
    } catch (err) {
      reply.send(err)
    }
  })

  fastify.post('/images', {
    schema: {
      summary: 'upload file',
      body: {
        type: 'object',
        properties: {
          'file-0': { type: 'object' }
        },
        required: ['file-0']
      }
    },
    handler: (request, reply) => {
      const file = request.body['file-0']
      uploadFile(file).then(
        reply.send({
          result: [
            {
              url: `https://tanque.nyc3.digitaloceanspaces.com/up/${file.name}`,
              name: file.name,
              size: file.data.length
            }
          ]
        })
      )
    }
  })
}

module.exports = routes
