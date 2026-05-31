/**
 * Utility to export data array to CSV with UTF-8 BOM for Excel compatibility
 */

export const exportToCSV = (data, filename = 'export.csv', headers = null) => {
  if (!data || !data.length) {
    if (window.showToast) {
      window.showToast('Không có dữ liệu để xuất file!', 'error');
    }
    return;
  }

  // Determine headers
  const keys = headers ? Object.keys(headers) : Object.keys(data[0]);
  const headerLabels = headers ? Object.values(headers) : keys;

  const csvRows = [];
  
  // Header row
  csvRows.push(headerLabels.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));

  // Data rows
  for (const row of data) {
    const values = keys.map(k => {
      let val = row[k];
      if (val === null || val === undefined) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\r\n');
  // Add UTF-8 BOM (\uFEFF) so Excel correctly displays Vietnamese / Unicode characters
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
