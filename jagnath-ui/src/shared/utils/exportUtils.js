import * as XLSX from 'xlsx';

/**
 * Shared utilities for copy-to-clipboard, CSV, and Excel exporting.
 * Uses data URIs to prevent Chrome insecure download blocks on HTTP connections.
 */

export const copyTextToClipboard = (text, onSuccess, onError) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => {
        if (onSuccess) onSuccess();
      })
      .catch(err => {
        console.error('Failed to copy using navigator.clipboard: ', err);
        fallbackCopyTextToClipboard(text, onSuccess, onError);
      });
  } else {
    fallbackCopyTextToClipboard(text, onSuccess, onError);
  }
};

const fallbackCopyTextToClipboard = (text, onSuccess, onError) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  // Keep off-screen
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      if (onSuccess) onSuccess();
    } else {
      if (onError) onError();
    }
  } catch (err) {
    console.error('Fallback copy failed: ', err);
    if (onError) onError();
  }
  document.body.removeChild(textArea);
};

export const downloadCSV = (headers, rows, filename) => {
  const BOM = '\uFEFF';
  const csvContent = BOM + [
    headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
    ...rows.map(row => row.map(val => {
      const stringVal = val === null || val === undefined ? '' : String(val);
      return `"${stringVal.replace(/"/g, '""')}"`;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadExcel = (headers, rows, filename) => {
  const exportData = rows.map(r => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = r[idx] === null || r[idx] === undefined ? '' : String(r[idx]);
    });
    return obj;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
};
