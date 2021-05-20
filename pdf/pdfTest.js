const { jsPDF } = require('jspdf')
const { logo } = require('./logo')
const { font } = require('./Handwriting-bold')
const moment = require('moment')

const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'in',
  format: [8.5, 11]
})

// add the font to jsPDF
doc.addFileToVFS('Handwriting-bold.ttf', font)
doc.addFont('Handwriting-bold.ttf', 'Handwriting', 'bold')

doc.addImage(logo, 'PNG', 2.8, 0.2)
doc.setFontSize(10)
doc.text('Go Therefore Ministries', 3.2, 1.2)
doc.text('PO Box 2135, Mount Juliet, TN 37121', 3.2, 1.4)
doc.text('615-773-1963', 3.2, 1.6)
doc.text('gothereforeministries@gmail.com', 3.2, 1.8)

doc.setFontSize(14)
doc.text('CONTRIBUTION STATEMENT', 2.9, 2.1)

doc.setFontSize(10)
let pos = 2.7
doc.text('David Rutherford\n3204 River Rock Pl\nWoodstock, GA 30188', 0.3, pos)

pos += 0.8
doc.text(new moment().format('MM/DD/YYYY'), 0.3, pos)

pos += 0.5
doc.text(
  'According to our records, your total 2021 donations were $175.00.\nThe fair market value of Life Reference Manuals provided was $59.70.\nThe total Tax Deductible portion of your gifts for 2021 is $115.30.',
  0.3,
  pos
)

pos += 0.8
doc.text(
  'These Life Reference Manuals have been printed in order to spread the Gospel of Jesus Christ to our neighbors, to people in our\nworkplaces, and to anyone who is in need of encouragement in this lost and hurting world. Go Therefore, Inc. is solely dependent\nupon contributions from individuals, ministries, and corporations like you, and your gifts are greatly appreciated.',
  0.3,
  pos
)

pos += 1.1
doc.text('Sally Ebel,\nTreasurer\nGo Therefore Ministries', 0.3, pos)

doc.setLineWidth(0.01)
doc.line(0.3, 10.0, 8.2, 10.0)

doc.text(
  'In accordance with the Internal Revenue Code Sec 6115 (a), the amount of your contribution that is deductible for\nFederal Income Tax purposes is limited to the amount that is in excess of the fair market value of any goods or services provided\nby Go Therefore, Inc. Please consult your tax advisor regarding the treatment of the remainder of your generous contribution.',
  0.3,
  10.2
)

doc.setFont('Handwriting', 'bold')
doc.setFontSize(22)
doc.text('Sally Ebel', 0.6, 5.6)

doc.save('./Completed.pdf')
