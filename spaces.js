const dotenv = require('dotenv')
const AWS = require('aws-sdk')

let endpoint,
  bucket,
  accessKeyId,
  secretAccessKey = ''
if (process.env.SPACES_ENDPOINT) {
  endpoint = process.env.SPACES_ENDPOINT
  bucket = process.env.SPACES_BUCKET
  accessKeyId = process.env.SPACES_ACCESS_KEY
  secretAccessKey = process.env.SPACES_SECRET_KEY
} else {
  // Load the config if it has not been done
  const env = dotenv.config()
  endpoint = env.parsed.SPACES_ENDPOINT
  bucket = env.parsed.SPACES_BUCKET
  accessKeyId = env.parsed.SPACES_ACCESS_KEY
  secretAccessKey = env.parsed.SPACES_SECRET_KEY
}

const spacesEndpoint = new AWS.Endpoint(endpoint)
const s3 = new AWS.S3({
  endpoint,
  accessKeyId,
  secretAccessKey
})

const getFileList = prefix => {
  console.log('Listing directory: ' + prefix)

  const params = {
    Bucket: bucket,
    Prefix: prefix
  }

  var p = new Promise(function (resolve, reject) {
    s3.listObjects(params, function (err, data) {
      if (err) {
        return reject(err)
      }

      resolve(
        data.Contents ? data.Contents.map(file => file['Key'].toString()) : []
      )
    })
  })

  return p
}

const uploadFile = file => {
  return new Promise(async (resolve, reject) => {
    console.log('Uploading file: ' + file.name)
    var params = {
      Body: file.data,
      Bucket: bucket,
      Key: `up/${file.name}`,
      ACL: 'public-read'
    }
    s3.putObject(params, function (err, data) {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}

module.exports = {
  getFileList,
  uploadFile
}
