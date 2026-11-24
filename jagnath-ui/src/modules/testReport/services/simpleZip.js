/**
 * @file simpleZip.js
 * @description Pure JavaScript ZIP file generator (Store mode - uncompressed DEFLATE 0)
 * Allows creating and downloading standard .zip files in any browser with zero external dependencies.
 */

// CRC-32 Lookup Table
const makeCrcTable = () => {
  let c;
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    crcTable[n] = c >>> 0;
  }
  return crcTable;
};

const crcTable = makeCrcTable();

const crc32 = (data) => {
  let crc = 0 ^ (-1);
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
};

export class SimpleZip {
  constructor() {
    this.files = [];
  }

  /**
   * Add a file to the ZIP
   * @param {string} filename 
   * @param {string|Uint8Array} content 
   */
  file(filename, content) {
    let data;
    if (typeof content === 'string') {
      const encoder = new TextEncoder();
      data = encoder.encode(content);
    } else if (content instanceof Uint8Array) {
      data = content;
    } else {
      data = new Uint8Array(content);
    }

    const nameEncoder = new TextEncoder();
    const nameBytes = nameEncoder.encode(filename.replace(/\\/g, '/'));

    this.files.push({
      name: filename,
      nameBytes,
      data,
      crc: crc32(data),
      size: data.length
    });
  }

  /**
   * Generate ZIP as a Blob
   * @returns {Blob}
   */
  generateBlob() {
    let localHeadersSize = 0;
    let centralDirSize = 0;

    for (const f of this.files) {
      localHeadersSize += 30 + f.nameBytes.length + f.size;
      centralDirSize += 46 + f.nameBytes.length;
    }

    const endOfCentralDirSize = 22;
    const totalSize = localHeadersSize + centralDirSize + endOfCentralDirSize;
    const buffer = new Uint8Array(totalSize);
    const view = new DataView(buffer.buffer);

    let offset = 0;
    const localOffsets = [];

    // 1. Write Local File Headers & File Data
    for (const f of this.files) {
      localOffsets.push(offset);

      // Local file header signature: 0x04034b50
      view.setUint32(offset, 0x04034b50, true);
      view.setUint16(offset + 4, 10, true); // Version needed to extract
      view.setUint16(offset + 6, 0, true);  // General purpose bit flag
      view.setUint16(offset + 8, 0, true);  // Compression method: 0 (stored)
      view.setUint16(offset + 10, 0, true); // Mod time
      view.setUint16(offset + 12, 0, true); // Mod date
      view.setUint32(offset + 14, f.crc, true); // CRC-32
      view.setUint32(offset + 18, f.size, true); // Compressed size
      view.setUint32(offset + 22, f.size, true); // Uncompressed size
      view.setUint16(offset + 26, f.nameBytes.length, true); // File name length
      view.setUint16(offset + 28, 0, true); // Extra field length

      offset += 30;
      buffer.set(f.nameBytes, offset);
      offset += f.nameBytes.length;

      buffer.set(f.data, offset);
      offset += f.size;
    }

    const centralDirStartOffset = offset;

    // 2. Write Central Directory Headers
    for (let i = 0; i < this.files.length; i++) {
      const f = this.files[i];
      const localOffset = localOffsets[i];

      // Central file header signature: 0x02014b50
      view.setUint32(offset, 0x02014b50, true);
      view.setUint16(offset + 4, 20, true); // Version made by
      view.setUint16(offset + 6, 10, true); // Version needed
      view.setUint16(offset + 8, 0, true);  // General purpose bit flag
      view.setUint16(offset + 10, 0, true); // Compression method: 0
      view.setUint16(offset + 12, 0, true); // Mod time
      view.setUint16(offset + 14, 0, true); // Mod date
      view.setUint32(offset + 16, f.crc, true); // CRC-32
      view.setUint32(offset + 20, f.size, true); // Compressed size
      view.setUint32(offset + 24, f.size, true); // Uncompressed size
      view.setUint16(offset + 28, f.nameBytes.length, true); // Name length
      view.setUint16(offset + 30, 0, true); // Extra length
      view.setUint16(offset + 32, 0, true); // Comment length
      view.setUint16(offset + 34, 0, true); // Disk # start
      view.setUint16(offset + 36, 0, true); // Internal file attr
      view.setUint32(offset + 38, 0, true); // External file attr
      view.setUint32(offset + 42, localOffset, true); // Relative offset of local header

      offset += 46;
      buffer.set(f.nameBytes, offset);
      offset += f.nameBytes.length;
    }

    const centralDirLength = offset - centralDirStartOffset;

    // 3. Write End of Central Directory Record
    // Signature: 0x06054b50
    view.setUint32(offset, 0x06054b50, true);
    view.setUint16(offset + 4, 0, true); // Disk number
    view.setUint16(offset + 6, 0, true); // Start disk
    view.setUint16(offset + 8, this.files.length, true); // Entries on this disk
    view.setUint16(offset + 10, this.files.length, true); // Total entries
    view.setUint32(offset + 12, centralDirLength, true); // Central directory size
    view.setUint32(offset + 16, centralDirStartOffset, true); // Offset of start
    view.setUint16(offset + 20, 0, true); // Comment length

    return new Blob([buffer], { type: 'application/zip' });
  }

  /**
   * Trigger direct browser download
   * @param {string} zipFileName 
   */
  download(zipFileName = 'reports.zip') {
    const blob = this.generateBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipFileName.endsWith('.zip') ? zipFileName : `${zipFileName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

