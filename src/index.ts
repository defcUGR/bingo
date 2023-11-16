import puppeteer from "puppeteer";
import { PDFDocument } from "pdf-lib";
import fs from "fs/promises";
import { shuffle, range, list, random } from "radash";
import express from "express";
import type { BingoJSON } from "@/types";

const PORT = 5501; // Puerto en el que ejecutar el servidor.
const N_COLS = 9; // Número de columnas en el cartón. NO CAMBIAR.
const N_ROWS = 3; // Número de filas en el cartón. NO CAMBIAR.
const EMPTY_CELLS = 4; // Número de celdas que deben quedarse vacías por fila. NO CAMBIAR.
const OUTPUT_DIR = "./output/"; // Carpeta donde generar los PDFs.
const N_CARDS = 250; // Número de cartones a generar.
const MERGE_CARDS = true; // Si se deben juntar todos los PDFs en uno.

/**
 * Elimina la segunda página (la última en este contexto) del PDF en la ruta dada.
 * @param {string} path - La ruta del PDF.
 */
async function removeLastPage(path) {
  const pdfData = await fs.readFile(path);
  const pdfDoc = await PDFDocument.load(pdfData);
  if (pdfDoc.getPageCount() <= 1) return;
  pdfDoc.removePage(1);
  const newPdfData = await pdfDoc.save();
  await fs.writeFile(path, newPdfData);
}

const app = express();
const server = app.listen(PORT);
app.use(express.static("template"));

(async () => {
  // Only remove previous files if they exist.
  try {
    await fs.rm(OUTPUT_DIR, { recursive: true }); // Elimina archivos anteriores.
  } catch {}
  await fs.mkdir(OUTPUT_DIR); // Crea el directorio de salida.
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto("http://localhost:5501", { waitUntil: "networkidle0" }); // Espera a que las fuentes se hayan cargado correctamente.
  const bingos = JSON.parse(
    (await fs.readFile("./bingos.json")).toString()
  ) as BingoJSON;
  for (const [nBingo, bingo] of bingos.entries()) {
    try {
      await fs.mkdir(OUTPUT_DIR + bingo.key);
    } catch {
      console.log(
        "Output directory " + OUTPUT_DIR + bingo.key + " already exists."
      );
    }
    for (const nCard of range(N_CARDS - 1)) {
      let card = []; // Cartón a generar.

      // Llenamos el cartón de resultados para posteriormente seleccionar las celdas vacías.
      for (const nCol of range(N_COLS - 1)) {
        let results = shuffle(
          bingo.results.filter(
            (result) => Math.floor((result.index - 1) / 10) === nCol
          )
        )
          .splice(0, N_ROWS)
          .sort((a, b) => a.index - b.index);
        if (results.length < N_ROWS)
          throw new Error(
            `Not enough results found for column ${nCol + 1} in bingo ${
              bingo.key
            }. Found: ${results.length}. Needed: ${N_ROWS}.`
          );
        card.push(results.map((result) => result.key));
      }

      // Pasamos a seleccionar las celdas vacías.

      // Primera fila.
      const firstEmptyCell = random(0, N_COLS - 1);
      const firstEmptyCells = shuffle(
        list(N_COLS - 1).filter((nCol) => nCol !== firstEmptyCell)
      )
        .splice(0, EMPTY_CELLS - 1)
        .concat(firstEmptyCell);
      for (const nCol of range(N_COLS - 1)) {
        if (firstEmptyCells.includes(nCol)) card[nCol][0] = "";
      }

      // Segunda fila.
      const secondEmptyCells = shuffle(
        list(N_COLS - 1).filter((nCol) => nCol !== firstEmptyCell)
      ).splice(0, EMPTY_CELLS);
      for (const nCol of range(N_COLS - 1)) {
        if (secondEmptyCells.includes(nCol)) card[nCol][1] = "";
      }

      // Tercera fila.
      let mandatoryThirdEmptyCells = [];
      for (const nCol of range(N_COLS - 1)) {
        if (card[nCol][0] !== "" && card[nCol][1] !== "") {
          card[nCol][2] = "";
          mandatoryThirdEmptyCells.push(nCol);
        }
      }
      if (mandatoryThirdEmptyCells.length < EMPTY_CELLS) {
        const thirdEmptyCells = shuffle(
          list(N_COLS - 1).filter(
            (nCol) =>
              !mandatoryThirdEmptyCells.includes(nCol) &&
              !(card[nCol][0] === "" && card[nCol][1] === "")
          )
        ).splice(0, EMPTY_CELLS - mandatoryThirdEmptyCells.length);
        for (const nCol of range(N_COLS - 1)) {
          if (thirdEmptyCells.includes(nCol)) card[nCol][2] = "";
        }
      }

      await page.evaluate(
        (card, color) => {
          let table = document.querySelector("table");
          table.style.backgroundColor = color;
          let rows = document.querySelectorAll("tr");
          for (const [nRow, row] of Object.entries(rows)) {
            let cols = row.querySelectorAll("td");
            for (const [nCol, col] of Object.entries(cols)) {
              col.innerText = card[nCol][nRow];
            }
          }
        },
        card,
        bingo.color
      );
      let outputPath = OUTPUT_DIR + bingo.key + "/" + nCard + ".pdf";
      await page.pdf({
        path: outputPath,
        height: "5cm",
        width: "10cm",
        printBackground: true,
      });
      await removeLastPage(outputPath);
    }
  }
  await browser.close();

  if (MERGE_CARDS) {
    let mergedPdf = await PDFDocument.create();
    for (const nBingo of bingos.keys())
      for (const nCard of [...Array(N_CARDS).keys()]) {
        const pdfFile = await fs.readFile(
          OUTPUT_DIR + bingos[nBingo].key + "/" + nCard + ".pdf"
        );
        const pdf = await PDFDocument.load(pdfFile);
        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices()
        );
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
    const mergedPdfFile = await mergedPdf.save();
    await fs.writeFile(OUTPUT_DIR + "merged.pdf", mergedPdfFile);
  }
  server.close();
})();
