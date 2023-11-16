import fs from "fs/promises";
import type { BingoJSON } from "@/types";

const OUTPUT_DIR = "./output"; // Carpeta donde generar los CSVs.

(async () => {
  const bingos = JSON.parse(
    (await fs.readFile("./bingos.json")).toString()
  ) as BingoJSON;

  try {
    await fs.mkdir(OUTPUT_DIR); // Crea el directorio de salida.
  } catch {}

  for (const [nBingo, bingo] of bingos.entries()) {
    // Export bingo.results to a CSV file where each entry is a row and each key is a column
    let csv = "Nombre corto,Nombre largo,Correspondencia numérica\n";
    for (const result of bingo.results) {
      for (const [key, value] of Object.entries(result)) {
        csv += value + ",";
      }
      csv = csv.slice(0, -1); // Remove last comma
      csv += "\n";
    }
    fs.writeFile(`${OUTPUT_DIR}/${bingo.key}.csv`, csv);
  }
})();
