import puppeteer from 'puppeteer';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs/promises';
import lodash from 'lodash';
import express from 'express';

const PORT = 5501; // Puerto en el que ejecutar el servidor.
const ROW_CELLS = 9; // Número de celdas por fila en los cartones.
const N_ROWS = 3; // Número de filas en el cartón.
const OUTPUT_DIR = './output/'; // Carpeta donde generar los PDFs.
const N_CARDS = 3; // Número de cartones a generar.
const MERGE_CARDS = true; // Si se deben juntar todos los PDFs en uno.

/**
 * Elimina la segunda página (la última en este contexto) del PDF en la ruta dada.
 * @param {string} path - La ruta del PDF.
 */
async function removeLastPage(path) {
  let pdfData = await fs.readFile(path);
  let pdfDoc = await PDFDocument.load(pdfData);
  pdfDoc.removePage(1);
  pdfData = await pdfDoc.save();
  await fs.writeFile(path, pdfData);
}

/**
 * Genera los índices de las celdas que dejar vacías.
 * @param {int} total - Total de celdas en la fila.
 * @param {int} empty - Número de celdas que deben quedarse vacías.
 * @return {Array} Índices de las celdas que deben quedarse vacías.
 */
function getEmptyCells(total, empty) {
  let indexes = [...Array(total).keys()]; // Generamos una lista con los números del 0 a total.
  return lodash.shuffle(indexes).slice(0, empty)
}

const app = express();
var server = app.listen(PORT);
app.use(express.static('template'));

(async () => {
  await fs.rm(OUTPUT_DIR, { recursive: true });
  await fs.mkdir(OUTPUT_DIR);
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5501');
  await page.exposeFunction('logInNodeJs', (value) => console.log(value)); // Por si hace falta hacer log dentro del page.evaluate()
  const bingos = JSON.parse(await fs.readFile('./bingos.json'));
  for(const [nBingo, bingo] of bingos.entries()) {
    try {
      await fs.mkdir(OUTPUT_DIR + nBingo);
    }
    catch {
      console.log('Output directory ' + OUTPUT_DIR + nBingo + ' already exists.');
    }
    for(const nCard of [...Array(N_CARDS).keys()]) {
      const emptyCells = [...Array(N_ROWS).keys()].map(() => getEmptyCells(ROW_CELLS, bingo.empty));
      const contents = lodash.shuffle(bingo.content).slice(0, (ROW_CELLS - bingo.empty)*N_ROWS);
      await page.evaluate((emptyCells, contents, color) => {
        let nCell = 0;
        let table = document.querySelector('table');
        table.style.backgroundColor = color;
        let rows = document.querySelectorAll('tr');
        for(const [nRow, row] of Object.entries(rows)) {
          let cells = row.querySelectorAll('td');
          for(const [index, cell] of Object.entries(cells)) {
            // logInNodeJs(`Row: ${nRow} Index: ${index} Change: ${cell.innerText} -> ${emptyCells[nRow].indexOf(parseInt(index)) == -1 ? contents[nCell] : '.'} (${nCell})`)
            if(emptyCells[nRow].indexOf(parseInt(index)) == -1) {
              cell.innerText = contents[nCell];
              nCell++;
            }
            else
              cell.innerText = '';
          }
        }
      }, emptyCells, contents, bingo.color);
      let outputPath = OUTPUT_DIR + nBingo + '/' + nCard + '.pdf';
      await page.pdf({ path: outputPath, height: '5cm', width: '10cm', printBackground: true });
      await removeLastPage(outputPath);
    }
  }
  await browser.close();

  if(MERGE_CARDS) {
    let mergedPdf = await PDFDocument.create();
    for(const nBingo of bingos.keys())
      for(const nCard of [...Array(N_CARDS).keys()]) {
        const pdfFile = await fs.readFile(OUTPUT_DIR + nBingo + '/' + nCard + '.pdf');
        const pdf = await PDFDocument.load(pdfFile);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      const mergedPdfFile = await mergedPdf.save();
      await fs.writeFile(OUTPUT_DIR + 'merged.pdf', mergedPdfFile);
  }
  server.close();
})();