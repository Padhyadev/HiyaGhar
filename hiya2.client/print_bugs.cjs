const xlsx = require('xlsx');
const path = require('path');

const wb = xlsx.readFile(path.resolve('../07-hiyaghar-qa-summary.xlsx'));
console.log('Sheet Names:', wb.SheetNames);

wb.SheetNames.forEach(name => {
  console.log(`\n================== SHEET: ${name} ==================`);
  const ws = wb.Sheets[name];
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
  rows.forEach((r, idx) => {
    if (r && r.length > 0) {
      console.log(`[Row ${idx + 1}]`, r.join(' | '));
    }
  });
});
