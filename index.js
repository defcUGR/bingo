import puppeteer from 'puppeteer';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs/promises';
import lodash from 'lodash';

const rowCells = 9; // Número de celdas por fila en los cartones.
const nRows = 3; // Número de filas en el cartón.
const outputDir = './output/'; // Carpeta donde generar los PDFs.
const nCards = 200; // Número de cartones a generar.
const mergeCards = true; // Si se deben juntar todos los PDFs en uno.

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

(async () => {
    await fs.rm(outputDir, { recursive: true });
    await fs.mkdir(outputDir);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:5501');
    await page.exposeFunction('logInNodeJs', (value) => console.log(value)); // Por si hace falta hacer log dentro del page.evaluate()
    const bingos = JSON.parse(await fs.readFile('./bingos.json'));
    for(const [nBingo, bingo] of bingos.entries()) {
      try {
        await fs.mkdir(outputDir + nBingo);
      }
      catch {
        console.log('Output directory ' + outputDir + nBingo + ' already exists.');
      }
      for(const nCard of [...Array(nCards).keys()]) {
        const emptyCells = [...Array(nRows).keys()].map(() => getEmptyCells(rowCells, bingo.empty));
        const contents = lodash.shuffle(bingo.content).slice(0, (rowCells - bingo.empty)*nRows);
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
        let outputPath = outputDir + nBingo + '/' + nCard + '.pdf';
        await page.pdf({ path: outputPath, height: '5cm', width: '10cm', printBackground: true });
        await removeLastPage(outputPath);
      }
    }
    await browser.close();

    if(mergeCards) {
      let mergedPdf = await PDFDocument.create();
      for(const nBingo of bingos.keys())
        for(const nCard of [...Array(nCards).keys()]) {
          const pdfFile = await fs.readFile(outputDir + nBingo + '/' + nCard + '.pdf');
          const pdf = await PDFDocument.load(pdfFile);
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        const mergedPdfFile = await mergedPdf.save();
        await fs.writeFile(outputDir + 'merged.pdf', mergedPdfFile);
    }
  })();