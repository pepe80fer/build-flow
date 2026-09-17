// Agrega la columna `photo_uri` a `expenses` para adjuntar la foto de un
// recibo (Entrega 2, parte 2). Nullable: los gastos existentes quedan sin
// foto y siguen funcionando igual.
export const MIGRATION_002_ADD_EXPENSE_PHOTO = `
ALTER TABLE expenses ADD COLUMN photo_uri TEXT;
`;
