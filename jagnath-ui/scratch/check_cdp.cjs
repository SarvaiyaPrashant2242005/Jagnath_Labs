const { spawn } = require('child_process');
const http = require('http');

async function main() {
  const chrome = spawn('google-chrome', [
    '--headless',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    'http://localhost:5174/#/quotations/provisional/print/new?autoprint=0'
  ]);

  // Wait for remote debugging to be ready
  await new Promise(r => setTimeout(r, 2000));

  http.get('http://localhost:9222/json', (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', async () => {
      const targets = JSON.parse(raw);
      console.log('Available targets:', targets.map(t => ({ title: t.title, url: t.url })));
      chrome.kill();
    });
  }).on('error', (err) => {
    console.error('CDP error:', err);
    chrome.kill();
  });
}

main();
