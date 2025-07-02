import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

export type MetroLineInfo = {
  ligne: string;
  date_ouverture: string;
  materiel_roulant: string;
  nombre_voyageurs: string;
  longueur_km: string;
  nombre_stations: string;
  temps_trajet_minutes: string;
};

export function getMetroLineInfo(lineId: string): MetroLineInfo | null {
  const csvPath = path.join(process.cwd(), "data", "metro_data.csv");
  const fileContent = fs.readFileSync(csvPath, "utf-8");
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    delimiter: ",",
  }) as MetroLineInfo[];

  return records.find((row) => row.ligne === lineId) || null;
}