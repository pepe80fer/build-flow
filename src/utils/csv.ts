// Utilidades de CSV compartidas por exportación (src/utils/export.ts) e
// importación (src/utils/importCsv.ts). El formato de escape/parseo es el
// estándar (comillas dobles cuando el valor tiene coma, comilla o salto de
// línea; comilla escapada como ""), compatible con lo que abre Excel/Sheets.

export function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(headers: string[], rows: string[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\n');
}

// Parser de CSV simple: soporta campos entre comillas con comas, comillas
// escapadas ("") y saltos de línea dentro del campo, y \n o \r\n como
// separador de fila. Devuelve una fila por línea (incluye el encabezado);
// omite líneas completamente vacías al final del archivo.
export function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < content.length) {
    const char = content[i];

    if (inQuotes) {
      if (char === '"') {
        if (content[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === ',') {
      row.push(field);
      field = '';
      i += 1;
      continue;
    }
    if (char === '\n' || char === '\r') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i += 1;
      if (char === '\r' && content[i] === '\n') {
        i += 1;
      }
      continue;
    }
    field += char;
    i += 1;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((cells) => !(cells.length === 1 && cells[0].trim() === ''));
}
