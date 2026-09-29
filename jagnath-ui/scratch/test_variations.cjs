const { spawn, execSync } = require('child_process');
const http = require('http');
const fs = require('fs');

async function testVariations() {
  console.log('Testing variations...');
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
    await send('Page.enable');
    await send('Runtime.enable');

    // Test 1-page scenario (evaluate modifying quotation state to 1 line item and minimal sections)
    const evalResult = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const pages = document.querySelectorAll('.gt-a4-page');
          const pageCounters = Array.from(pages).map(p => p.querySelector('div:last-child')?.textContent?.trim());
          return {
            pageCount: pages.length,
            pageCounters: pageCounters
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Standard Akshaar Quotation DOM verification:', JSON.stringify(evalResult.result.value, null, 2));

    ws.close();
  } catch (err) {
    console.error('Error in variation test:', err);
  } finally {
    chrome.kill();
  }
}

testVariations();
