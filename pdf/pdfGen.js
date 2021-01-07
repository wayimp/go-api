const { jsPDF } = require('jspdf')
const moment = require('moment')
const { font } = require('./Handwriting-bold')

Array.prototype.sum = function (prop) {
  var total = 0
  for (var i = 0, _len = this.length; i < _len; i++) {
    if (this[i] && this[i][prop]) {
      total += this[i][prop]
    }
  }
  return total
}

const truncateString = (str, num) => {
  // If the length of str is less than or equal to num
  // just return str--don't truncate it.
  if (str.length <= num) {
    return str
  }
  // Return str truncated with '...' concatenated to the end of str.
  return str.slice(0, num) + '...'
}

const testWhite = x => {
  var white = new RegExp(/^\s$/)
  return white.test(x.charAt(0))
}

const wordWrap = (str, maxWidth) => {
  var newLineStr = '\n'
  done = false
  res = ''
  while (str.length > maxWidth) {
    found = false
    // Inserts new line at first whitespace of the line
    for (i = maxWidth - 1; i >= 0; i--) {
      if (testWhite(str.charAt(i))) {
        res = res + [str.slice(0, i), newLineStr].join('')
        str = str.slice(i + 1)
        found = true
        break
      }
    }
    // Inserts new line at maxWidth position, the word is too long to wrap
    if (!found) {
      res += [str.slice(0, maxWidth), newLineStr].join('')
      str = str.slice(maxWidth)
    }
  }

  return res + str
}

const pdfGen = order => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: [8.5, 11]
  })

  // add the font to jsPDF
  doc.addFileToVFS('Handwriting-bold.ttf', font)
  doc.addFont('Handwriting-bold.ttf', 'Handwriting', 'bold')

  const logo =
    'data:image/png;base64,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'

  doc.addImage(logo, 'PNG', 0.3, 0.2)
  doc.setFontSize(10)
  doc.text('Valley Cutting Systems', 0.3, 1.0)
  doc.text('P.O. Box 607, Three Rivers, CA 93271', 0.3, 1.2)
  doc.text('(559) 684-1229 OPT 3', 0.3, 1.4)

  doc.setFontSize(18)
  doc.text('FIELD SERVICE ORDER', 4, 0.7)

  doc.setFontSize(10)
  doc.text('Job #' + order.job, 4, 1.0)
  doc.text('PO #' + order.po, 4, 1.2)
  doc.text(new moment(order.date).format('MM/DD/YYYY'), 4, 1.4)

  doc.setLineWidth(0.05)
  doc.line(0.3, 1.6, 8.2, 1.6)

  let linePosition = 1.7
  doc.text(order.customerName, 0.3, (linePosition += 0.2))
  doc.text(order.customerStreet, 0.3, (linePosition += 0.2))
  if (order.customerStreet2) {
    doc.text(order.customerStreet2, 0.3, (linePosition += 0.2))
  }
  doc.text(
    order.customerCity +
      ', ' +
      order.customerState +
      ' ' +
      order.customerZip,
    0.3,
    (linePosition += 0.2)
  )
  doc.text(order.customerPhone, 0.3, (linePosition += 0.2))

  linePosition = 1.7
  doc.text('Machine Type: ' + order.machineType, 4, (linePosition += 0.2))
  doc.text(
    'Machine Serial #: ' + order.machineSerial,
    4,
    (linePosition += 0.2)
  )

  if (order.machineManufactureDate) {
    doc.text(
      'Manufacture Date: ' +
        new moment(order.machineManufactureDate).format('MM/DD/YYYY'),
      4,
      (linePosition += 0.2)
    )
  }

  if (order.machinePowerSupply) {
    doc.text(
      'Power Supply: ' + order.machinePowerSupply,
      4,
      (linePosition += 0.2)
    )
  }

  doc.text(
    'Control Model: ' +
      order.torchHeightControlModel +
      '   Control Serial #: ' +
      order.torchHeightControlSerial,
    4,
    (linePosition += 0.2)
  )

  doc.text(
    'Positioner Serial: ' +
      order.positionerSerial +
      '   Interface Serial #: ' +
      order.interfaceSerial,
    4,
    (linePosition += 0.2)
  )

  doc.text(
    'Drive Model: ' +
      order.driveModel +
      '   Drive Serial #: ' +
      order.driveSerial,
    4,
    (linePosition += 0.2)
  )

  const oxy =
    'Oxy Fuel: ' +
    (order.oxyFuel ? 'Yes' : 'No') +
    '   Number of Torches: ' +
    order.torches

  doc.text(oxy, 4, (linePosition += 0.2))

  order.plasmas.map(plasma => {
    doc.text(
      'Plasma Type: ' +
        plasma.plasmaType +
        '   Plasma Model: ' +
        plasma.plasmaModel +
        '   Plasma Serial #: ' +
        plasma.plasmaSerial,
      1.5,
      (linePosition += 0.2)
    )

    doc.text(
      'Gas Console Serial #: ' +
        plasma.gasConsoleSerial +
        '   Gas Console Manufacture Date: ' +
        plasma.gasConsoleManufactureDate,
      1.5,
      (linePosition += 0.2)
    )
  })

  doc.setLineWidth(0.2)
  linePosition += 0.4
  doc.line(0.3, linePosition, 3.7, linePosition)
  doc.line(4.0, linePosition, 8.2, linePosition)

  linePosition += 0.05
  doc.setTextColor(255, 255, 255)
  doc.text('ORDERED TROUBLE', 1.3, linePosition)
  doc.text('MATERIALS USED', 5.3, linePosition)

  doc.setTextColor(0, 0, 0)
  const orderedTrouble = wordWrap(order.orderedTrouble, 54)
  const orderedTroubleLines = orderedTrouble.split(/\r\n|\r|\n/).length
  doc.text(orderedTrouble, 0.3, linePosition + 0.2)

  order.materials.map(material => {
    doc.text(
      material.quantity +
        'x'.padEnd(4, ' ') +
        truncateString(material.description, 54),
      4.0,
      (linePosition += 0.2)
    )
  })

  if (orderedTroubleLines > order.materials.length) {
    linePosition += (orderedTroubleLines - order.materials.length) * 0.2
  } else {
    linePosition += 0.4
  }

  doc.line(0.3, linePosition, 3.7, linePosition)
  doc.line(4.0, linePosition, 8.2, linePosition)

  linePosition += 0.05
  doc.setTextColor(255, 255, 255)
  doc.text('SERVICE PERFORMED', 1.3, linePosition)
  doc.text('FOLLOW UP ISSUES', 5.3, linePosition)

  doc.setTextColor(0, 0, 0)
  const servicePerformed = wordWrap(order.servicePerformed, 54)
  const servicePerformedLines = servicePerformed.split(/\r\n|\r|\n/).length
  doc.text(servicePerformed, 0.3, linePosition + 0.2)

  order.issues.map(issue => {
    const issueDescription = truncateString(issue.description, 60)
    doc.text(issueDescription, 4.0, (linePosition += 0.2))
    if (issue.resolved) {
      doc.setLineWidth(0.01)
      doc.line(
        4.0,
        linePosition - 0.04,
        4.0 + issueDescription.length * 0.067,
        linePosition - 0.04
      )
    }
  })

  if (servicePerformedLines > order.issues.length) {
    linePosition += (servicePerformedLines - order.issues.length) * 0.2
  } else {
    linePosition += 0.4
  }

  doc.setLineWidth(0.2)
  doc.line(0.3, linePosition, 8.2, linePosition)

  linePosition += 0.05
  doc.setTextColor(255, 255, 255)
  doc.text('TIMESHEETS', 1.3, linePosition)

  doc.setTextColor(0, 0, 0)
  order.tsheets.map(sheet => {
    const start = new Date(sheet.start)
    const end = new Date(sheet.end)
    const duration = new Date(1000 * sheet.duration).toISOString().substr(11, 5)
    doc.text(
      sheet.date.padEnd(16, ' ') +
        start
          .getUTCHours()
          .toString()
          .padStart(2, '0') +
        ':' +
        start
          .getUTCMinutes()
          .toString()
          .padStart(2, '0')
          .padEnd(8, ' ') +
        end
          .getUTCHours()
          .toString()
          .padStart(2, '0') +
        ':' +
        end
          .getUTCMinutes()
          .toString()
          .padStart(2, '0')
          .padEnd(8, ' ') +
        duration.padEnd(8, ' ') +
        sheet.name.padEnd(20, ' ') +
        sheet.notes,
      0.3,
      (linePosition += 0.2)
    )
  })

  const totalDuration = order.tsheets.sum('duration')
  const totalHours = new Date(1000 * totalDuration).toISOString().substr(11, 5)
  doc.text('Total Hours: ' + totalHours, 1.6, (linePosition += 0.2))

  doc.setLineWidth(0.05)
  linePosition += 0.2
  doc.line(0.3, linePosition, 8.2, linePosition)

  doc.text(
    'Job Completed: ' + (order.completed ? 'Yes' : 'No'),
    0.3,
    (linePosition += 0.2)
  )

  doc.text(
    'Job Completed to Customer Satisfaction: ' +
      (order.satisfaction ? 'Yes' : 'No'),
    4.0,
    linePosition
  )

  linePosition += 0.4
  doc.setLineWidth(0.01)
  doc.line(0.3, linePosition, 3.7, linePosition)
  doc.line(4.0, linePosition, 8.2, linePosition)

  linePosition += 0.2
  doc.text(
    order.servicemanSignatureDate ? order.servicemanSignatureDate : '',
    0.6,
    linePosition
  )
  doc.text(
    order.customerSignatureDate ? order.customerSignatureDate : '',
    4.3,
    linePosition
  )

  linePosition -= 0.2
  doc.setFont('Handwriting', 'bold')
  doc.setFontSize(22)
  doc.text(order.servicemanSignature, 0.6, linePosition)
  doc.text(order.customerSignature, 4.3, linePosition)

  const arraybuffer = doc.output('arraybuffer')

  const buffer = new Buffer.from(arraybuffer)

  return buffer
}

module.exports = { pdfGen }
