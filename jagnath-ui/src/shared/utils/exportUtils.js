/**
 * Shared utilities for copy-to-clipboard and CSV exporting.
 * Prevents insecure download blocks and clipboard errors on HTTP connections.
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
  // Add UTF-8 BOM for Excel to open it correctly with UTF-8 encoding
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
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
