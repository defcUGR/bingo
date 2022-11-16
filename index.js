const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:5500');
    var cells = await page.$$('.cell');
    await page.pdf({ path: 'test.pdf', height: '5cm', width: '10cm', printBackground: true });
    await browser.close();
  })();