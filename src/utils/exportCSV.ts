export const exportCSV = (rows: any[], filename = 'export.csv') => {
  if (!rows.length) return;
  
  const header = Object.keys(rows[0]);
  const body = rows.map(r => 
    header.map(h => JSON.stringify(r[h] ?? '')).join(',')
  );
  
  const csv = [header.join(','), ...body].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const link = Object.assign(document.createElement('a'), { 
    href: url, 
    download: filename 
  });
  
  link.click();
  URL.revokeObjectURL(url);
};