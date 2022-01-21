const moment = require('moment-timezone')
const dateFormat = 'YYYY-MM-DDTHH:mm:SS'
const { ObjectId } = require('mongodb')

async function routes (fastify, options) {
  const metricsCollection = fastify.mongo.db.collection('metrics')

  fastify.get('/metrics/:action/:id', {}, async function (request, reply) {
    try {
      const {
        params: { action, id }
      } = request

      // Add an entry to the metrics for this topic
      const created = metricsCollection.insertOne({
        action,
        id,
        actionDate: new Date(moment().tz('America/Chicago'))
      })

      return created
    } catch (err) {
      reply.send(err)
    }
  })

  fastify.get('/topicActionSummary/:action', {}, async function (
    request,
    reply
  ) {
    try {
      const {
        params: { action }
      } = request

      const pipeline = [
        {
          $match: {
            action: action
          }
        },
        {
          $group: {
            _id: '$id',
            count: {
              $sum: 1
            }
          }
        },
        {
          $addFields: {
            topicId: {
              $toObjectId: '$_id'
            }
          }
        },
        {
          $lookup: {
            from: 'topics',
            localField: 'topicId',
            foreignField: '_id',
            as: 'topic'
          }
        },
        {
          $project: {
            count: 1,
            'topic.title': 1
          }
        },
        {
          $sort: {
            count: -1
          }
        }
      ]

      const summary = await metricsCollection.aggregate(pipeline).toArray()

      const flattened = summary.map(s => ({
        title: s.topic?.[0]?.title,
        count: s.count
      }))

      return flattened
    } catch (err) {
      reply.send(err)
    }
  })

  fastify.get('/verseActionSummary/:action', {}, async function (
    request,
    reply
  ) {
    try {
      const {
        params: { action }
      } = request

      const pipeline = [
        {
          $match: {
            action: action
          }
        },
        {
          $group: {
            _id: '$id',
            count: {
              $sum: 1
            }
          }
        },
        {
          $sort: {
            count: -1
          }
        }
      ]

      const summary = await metricsCollection.aggregate(pipeline).toArray()

      return summary
    } catch (err) {
      reply.send(err)
    }
  })
}

module.exports = routes
