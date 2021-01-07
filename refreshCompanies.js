const axios = require('axios')
let companiesCollectionRef

const parseJobCodesPage = async jobCodes => {
  const names = await Object.entries(jobCodes.results.jobcodes).map(
    async ([key, value]) => {
      if (value.name) {
        const company = { name: value.name, job: value.id }
        if (value.locations && value.locations.length > 0) {
          const locationCode = value.locations[0]
          const locationInfo =
            jobCodes.supplemental_data.locations[locationCode]
          if (locationInfo) {
            company.addr1 = locationInfo.addr1
            company.addr2 = locationInfo.addr2
            company.city = locationInfo.city
            company.state = locationInfo.state
            company.zip = locationInfo.zip
            company.formatted_address = locationInfo.formatted_address
            company.country = locationInfo.country
            company.active = locationInfo.active
            company.latitude = locationInfo.latitude
            company.longitude = locationInfo.longitude
            company.label = locationInfo.label
          }
        }

        await companiesCollectionRef.insertOne(company)
      }
    }
  )
}

const getJobCodesPage = async pageNo => {
  const url = 'https://rest.tsheets.com/api/v1/jobcodes'

  await axios
    .get(url, {
      params: { page: pageNo },
      headers: {
        Authorization: 'Bearer S.5__8e128a072a0b7cebf73f4a5759297c039b50f6c4',
        'Cache-Control': 'no-cache'
      }
    })
    .then(async response => {
      // console.log('Job Codes Received')
      await parseJobCodesPage(response.data)
    })
    .catch(error => {
      console.log('Error retrieving job codes: ' + error)
    })
}

const refreshCompanies = async companiesCollection => {
  companiesCollectionRef = companiesCollection
  await getJobCodesPage(1)
  await getJobCodesPage(2)
  await getJobCodesPage(3)
  await getJobCodesPage(4)
}

module.exports = { refreshCompanies }
