import fs from 'node:fs';

const path = 'src/features/catalogue/seed.json';
let content = fs.readFileSync(path, 'utf8');

content = content.replaceAll('Ã—', '×').replaceAll('â€”', '—');

const parsed = JSON.parse(content);
const frm001 = parsed.products.find(p => p.id === 'FRM-001');

if (frm001) {
  const existingIds = new Set(frm001.variants.map(v => v.id));
  if (!existingIds.has('FRM-001-REQ-3')) {
    frm001.variants.push({
      id: 'FRM-001-REQ-3',
      size: '14×20 in',
      metric: '35×50 cm',
      thickness: '20 mm moulding',
      finish: 'Classic Teak & Charcoal',
      price: null,
      status: 'Studio standard'
    });
  }
  if (!existingIds.has('FRM-001-REQ-4')) {
    frm001.variants.push({
      id: 'FRM-001-REQ-4',
      size: '18×24 in',
      metric: '45×60 cm',
      thickness: '20 mm moulding',
      finish: 'Classic Teak & Charcoal',
      price: null,
      status: 'Studio standard'
    });
  }
}

fs.writeFileSync(path, JSON.stringify(parsed, null, 2), 'utf8');
console.log('Cleaned and augmented seed.json successfully!');
