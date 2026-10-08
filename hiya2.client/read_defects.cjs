const xlsx = require('xlsx');
const path = require('path');

const wb = xlsx.readFile(path.resolve('../07-hiyaghar-qa-summary.xlsx'));
const ws = wb.Sheets['Defects'];
const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });

console.log('--- ALL DEFECTS IN 07-hiyaghar-qa-summary.xlsx ---');
rows.forEach((r, idx) => {
  if (idx === 0) return;
  console.log(`\n------------------------------------------------------------`);
  console.log(`[${r[0]}] Severity: ${r[1]} | Area: ${r[2]} | Location: ${r[3]}`);
  console.log(`Title: ${r[4]}`);
  console.log(`Expected: ${r[5]}`);
  console.log(`Actual: ${r[6]}`);
  console.log(`Impact: ${r[7]}`);
  console.log(`Fix: ${r[8]}`);
});
