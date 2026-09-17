import { Directory, File, Paths } from 'expo-file-system';

const RECEIPTS_DIRECTORY_NAME = 'receipts';

function getReceiptsDirectory(): Directory {
  const directory = new Directory(Paths.document, RECEIPTS_DIRECTORY_NAME);
  if (!directory.exists) {
    directory.create();
  }
  return directory;
}

// expo-image-picker devuelve una foto en una ubicación temporal (caché) que
// el sistema puede limpiar en cualquier momento. La copiamos a una carpeta
// persistente de la app (documentDirectory/receipts) y devolvemos esa URI
// final, que es la que se guarda en `expenses.photo_uri`.
export async function saveReceiptPhoto(temporaryUri: string): Promise<string> {
  const receiptsDirectory = getReceiptsDirectory();
  const extensionMatch = /\.(\w+)$/.exec(temporaryUri.split('?')[0]);
  const extension = extensionMatch?.[1] ?? 'jpg';
  const filename = `receipt-${Date.now()}.${extension}`;

  const sourceFile = new File(temporaryUri);
  const destinationFile = new File(receiptsDirectory, filename);
  await sourceFile.copy(destinationFile);
  return destinationFile.uri;
}

// Borra el archivo de foto guardado, si existe. No lanza si ya no existe o
// no se puede borrar (no es crítico: en el peor caso queda un archivo
// huérfano en el almacenamiento del teléfono).
export function deleteReceiptPhoto(photoUri: string): void {
  try {
    const file = new File(photoUri);
    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.error('No se pudo borrar la foto del recibo', error);
  }
}
