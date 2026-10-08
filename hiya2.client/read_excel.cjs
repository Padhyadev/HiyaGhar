const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Try finding exceljs or xlsx or writing simple zip parser
const excelPath = path.resolve('../07-hiyaghar-qa-summary.xlsx');
console.log('Reading:', excelPath);

// Let's check node_modules for xlsx / exceljs / unzipper
try {
  const xlsx = require('xlsx');
  const wb = xlsx.readFile(excelPath);
  console.log('Sheets:', wb.SheetNames);
  wb.SheetNames.forEach(sheetName => {
    console.log('----------------------------------------------------');
    console.log('SHEET NAME:', sheetName);
    console.log('----------------------------------------------------');
    const ws = wb.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
    data.slice(0, 40).forEach((row, i) => {
      if (row && row.length > 0) {
        console.log(`Row ${i + 1}:`, row.join(' | '));
      }
    });
  });
} catch (e) {
  console.log('xlsx not found directly, installing or reading zip:', e.message);
}
