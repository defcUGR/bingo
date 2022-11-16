import puppeteer from 'puppeteer';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs/promises';


async function removeLastPage(path) {
  var pdfData = await fs.readFile(path);
  var pdfDoc = await PDFDocument.load(pdfData);
  pdfDoc.removePage(1)
  var pdfData = await pdfDoc.save();
  await fs.writeFile(path, pdfData);
}

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:5501');
    await page.evaluate(() => {
      let rows = document.querySelectorAll('tr');
      for(let row of rows) {
        let cells = row.querySelectorAll('td');
        for(let cell of cells)
          cell.innerText = '1';
      }
    });
    await page.pdf({ path: './output/test.pdf', height: '5cm', width: '10cm', printBackground: true });
    await removeLastPage('./output/test.pdf');
    await browser.close();
  })();