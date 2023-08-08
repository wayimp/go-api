const dotenv = require('dotenv')
const moment = require('moment')
const { S3, ListObjectsCommand, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

let bucket,
  accessKeyId,
  secretAccessKey = ''

if (process.env.SPACES_BUCKET) {
  bucket = process.env.SPACES_BUCKET
  accessKeyId = process.env.SPACES_ACCESS_KEY
  secretAccessKey = process.env.SPACES_SECRET_KEY
} else {
  // Load the config if it has not been done
  const env = dotenv.config()
  bucket = env.parsed.SPACES_BUCKET
  accessKeyId = env.parsed.SPACES_ACCESS_KEY
  secretAccessKey = env.parsed.SPACES_SECRET_KEY
}

const s3Client = new S3({
  forcePathStyle: false, // Configures to use subdomain/virtual calling format.
  endpoint: "https://nyc3.digitaloceanspaces.com",
  region: "us-east-1",
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey
  }
});

const getFileList = async prefix => {
  console.log('Listing directory: ' + prefix)

  const params = {
    Bucket: bucket,
    Prefix: prefix
  }

  try {
    const data = await s3Client.send(new ListObjectsCommand(params));
    console.log("Success", data);
    return data;
  } catch (err) {
    console.log("Error", err);
  }
}

const getFile = async filename => {
  console.log('Retriving object: ' + filename)

  const params = {
    Bucket: bucket,
    Key: `pro/${filename}`
  }

  try {
    const result = await s3Client.send(new GetObjectCommand(params));
    // The Body object also has 'transformToByteArray' and 'transformToWebStream' methods.
    const byteArray = await result.Body.transformToByteArray();
    return byteArray
  } catch (err) {
    console.log("Error", err);
  }
}

const uploadFile = async file => {
  console.log('Uploading file: ' + file.filename)
  var params = {
    Body: file._buf,
    Bucket: bucket,
    Key: `pro/${file.filename}`,
    ACL: 'public-read'
  }
  try {
    const data = await s3Client.send(new PutObjectCommand(params));
    console.log(
      "Successfully uploaded object: " +
      params.Bucket +
      "/" +
      params.Key
    );
    return data;
  } catch (err) {
    console.log("Error", err);
  }
}

const uploadBackup = backup => {
  return new Promise(async (resolve, reject) => {
    const fileName = new moment().format('YY-MM-DD') + '.json'

    console.log('Uploading file: ' + fileName)
    var params = {
      Body: backup._buf,
      Bucket: bucket,
      Key: `backup/${fileName}`,
      ACL: 'public-read'
    }
    try {
      const data = await s3Client.send(new PutObjectCommand(params));
      console.log(
        "Successfully uploaded object: " +
        params.Bucket +
        "/" +
        params.Key
      );
      return data;
    } catch (err) {
      console.log("Error", err);
    }
  })
}


module.exports = {
  getFileList,
  uploadFile,
  getFile,
  uploadBackup,
}
