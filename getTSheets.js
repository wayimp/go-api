const axios = require('axios')

const parseTSheets = async tsheet => {
  const sheets = []
  await Object.entries(tsheet.results.timesheets).map(async ([key, value]) => {
    if (value.id) {
      const sheet = { id: value.id }
      sheet.date = value.date
      sheet.start = value.start
      sheet.end = value.end
      sheet.duration = value.duration

      if (value.user_id) {
        if (tsheet.supplemental_data && tsheet.supplemental_data.users) {
          const user = tsheet.supplemental_data.users[value.user_id]
          if (user) {
            sheet.name = user.first_name + ' ' + user.last_name
          }
        }
      }

      if (value.customfields) {
        Object.entries(value.customfields).map(([key, value]) => {
          if (value) {
            if (
              tsheet.supplemental_data &&
              tsheet.supplemental_data.customfields
            ) {
              const customfieldInfo = tsheet.supplemental_data.customfields[key]
              if (customfieldInfo) {
                if (sheet.notes) {
                  sheet.notes += ','
                } else {
                  sheet.notes = ''
                }
                sheet.notes += customfieldInfo.name + ':' + value
              }
            }
          }
        })
      }
      sheets.push(sheet)
    }
  })
  return sheets
}

const getTSheets = async (jobCode, startDate) => {
  const url = 'https://rest.tsheets.com/api/v1/timesheets'

  const fullDate = new Date(startDate)
  const dateOnly = `${fullDate.getFullYear()}-${String(
    fullDate.getMonth() + 1
  ).padStart(2, '0')}-${String(fullDate.getDate()).padStart(2, '0')}`

  const tsheets = await axios
    .get(url, {
      params: { jobcode_ids: jobCode, start_date: dateOnly },
      headers: {
        Authorization: 'Bearer S.5__8e128a072a0b7cebf73f4a5759297c039b50f6c4',
        'Cache-Control': 'no-cache'
      }
    })
    .then(async response => {
      const sheets = await parseTSheets(response.data)
      return sheets
    })
    .catch(error => {
      console.log('Error retrieving TSheets: ' + error)
    })

  return tsheets
}

module.exports = { getTSheets }
