const { spawn, execSync } = require('child_process');
const http = require('http');
const fs = require('fs');


async function main() {
  const chrome = spawn('google-chrome', [
    '--headless',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    'http://localhost:5174/#/quotations/provisional/print/new?autoprint=0'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const list = await new Promise((resolve, reject) => {
      http.get('http://localhost:9222/json', res => {
        let raw = '';
        res.on('data', c => raw += c);
        res.on('end', () => resolve(JSON.parse(raw)));
      }).on('error', reject);
    });

    const pageTarget = list.find(t => t.type === 'page' && t.url.includes('localhost:5174'));
    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
      throw new Error('Page target not found in Chrome: ' + JSON.stringify(list));
    }

    console.log('Connecting to WebSocket:', pageTarget.webSocketDebuggerUrl);
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    let msgId = 1;
    const callbacks = {};

    ws.addEventListener('message', (event) => {
      const resp = JSON.parse(event.data);
      if (resp.id && callbacks[resp.id]) {
        callbacks[resp.id](resp);
        delete callbacks[resp.id];
      }
    });

    const send = (method, params = {}) => {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        callbacks[id] = (resp) => {
          if (resp.error) reject(resp.error);
          else resolve(resp.result);
        };
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    await new Promise(r => ws.addEventListener('open', r));

    // Enable Page, Runtime, and Console
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Log.enable');

    ws.addEventListener('message', (event) => {
      const resp = JSON.parse(event.data);
      if (resp.method === 'Runtime.consoleAPICalled') {
        console.log('Browser Console:', resp.params.args.map(a => a.value || a.description).join(' '));
      }
      if (resp.method === 'Runtime.exceptionThrown') {
        console.error('Browser Exception:', resp.params.exceptionDetails);
      }
    });

    // Navigate to print page
    console.log('Navigating to print URL...');
    await send('Page.navigate', { url: 'http://localhost:5174/#/quotations/provisional/print/new?autoprint=0' });

    // Wait for load and React mount
    let ready = false;
    for (let i = 0; i < 50; i++) {
      await new Promise(r => setTimeout(r, 200));
      const evalRes = await send('Runtime.evaluate', {
        expression: '({ ready: Boolean(window.__PRINT_READY__), htmlLen: document.getElementById("root")?.innerHTML?.length || 0 })',
        returnByValue: true
      });
      const val = evalRes.result?.value;
      if (val && val.ready) {
        ready = true;
        console.log('Document ready for print after ' + ((i + 1) * 200) + 'ms, root HTML length: ' + val.htmlLen);
        break;
      }
    }

    if (!ready) {
      console.warn('Timed out waiting for __PRINT_READY__, proceeding with print');
    }

    // Print to PDF
    const printRes = await send('Page.printToPDF', {
      printBackground: true,
      preferCSSPageSize: true,
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      paperWidth: 8.27,  // A4 in inches
      paperHeight: 11.69
    });

    const pdfBuffer = Buffer.from(printRes.data, 'base64');
    const pdfPath = '/home/jevin/.gemini/antigravity-ide/brain/8f0341d5-bd33-406d-8864-a4998ca304b0/scratch/akshaar_printed.pdf';
    fs.writeFileSync(pdfPath, pdfBuffer);
    console.log('Saved PDF to', pdfPath, 'size:', pdfBuffer.length);

    // Rasterize pages
    const outputPrefix = '/home/jevin/.gemini/antigravity-ide/brain/8f0341d5-bd33-406d-8864-a4998ca304b0/scratch/akshaar_page';
    execSync(`rm -f ${outputPrefix}* && pdftoppm -png -r 150 "${pdfPath}" "${outputPrefix}"`);
    console.log('Rasterized pages successfully!');

    ws.close();
  } catch (err) {
    console.error('Error in render script:', err);
  } finally {
    chrome.kill();
  }
}

main();
