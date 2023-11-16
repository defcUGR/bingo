import fs from "fs/promises";
import * as csv from "csv";
import type { BingoJSON } from "@/types";

const INPUT_DIR = "./output"; // Carpeta donde buscar los CSVs.

(async () => {
  let bingos = JSON.parse(
    (await fs.readFile("./bingos.json")).toString()
  ) as BingoJSON;

  for (const bingo of bingos) {
    try {
      const results = (
        await csv
          .parse(await fs.readFile(`${INPUT_DIR}/${bingo.key}.csv`))
          .toArray()
      ).slice(1);
      for (const [i, result] of results.entries()) {
        bingo.results[i].key = result[0];
        bingo.results[i].value = result[1];
        bingo.results[i].index = parseInt(result[2]);
      }
    } catch {
      console.log(
        `No pudo abrir el archivo ${bingo.key}.csv en la carpeta ${INPUT_DIR}.`
      );
    }
  }
  await fs.writeFile("./bingos.json", JSON.stringify(bingos));
})();
