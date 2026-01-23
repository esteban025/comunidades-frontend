import { db } from "@/lib/db";
import type { Parish } from "@/types/parishes";
interface ManageParishResponse {
  success: boolean;
  message: string;
  parish?: Parish | Parish[];
}

// Obtener todas las parroquias
export const getParishes = async (): Promise<ManageParishResponse> => {
  const query = "SELECT * FROM parishes ORDER BY id ASC";
  const [rows] = await db.query(query)
  const data = rows as Parish[];
  return {
    success: true,
    message: "Parroquias obtenidas exitosamente",
    parish: data,
  };
}

// Crear una nueva parroquia
export const createParish = async (params: Omit<Parish, "id">): Promise<ManageParishResponse> => {
  const { name, tag, aka } = params;
  // verificamos que no exista una parroquia con los mismos datos
  const checkQuery = `
    SELECT * FROM parishes WHERE name = ? OR tag = ? OR aka = ?
  `;
  const [existingRows] = await db.query(checkQuery, [name, tag, aka]);
  const existingParishes = existingRows as Parish[];
  if (existingParishes.length > 0) {
    return {
      success: false,
      message: "Ya existe una parroquia con el mismo nombre, tag o alias. ss",
    };
  }

  // si no existe
  const insertQuery = `
    INSERT INTO parishes (name, tag, aka) VALUES (?, ?, ?)
  `
  const [result] = await db.query(insertQuery, [name, tag, aka])
  const insertResult = result as any
  const newParishId = insertResult.insertId
  const newParish: Parish = {
    id: newParishId,
    name,
    tag,
    aka,
  }
  return {
    success: true,
    message: "Parroquia creada exitosamente ss",
    parish: newParish,
  }
};

// Actualizar una parroquia existente
export const updateParish = async (id: number, data: Omit<Parish, "id">) => {
  const { name, tag, aka } = data
  const query = `UPDATE parishes SET name = ?, tag = ?, aka = ? WHERE id = ?`
  const [result] = await db.query(query, [name, tag, aka, id])

  return {
    success: true,
    message: "Parroquia actualizada exitosamente ss"
  }
}

// Eliminar una parroquia
export const deleteParish = async (id: number) => {
  const deleteQuery = `DELETE FROM parishes WHERE id = ?`
  const [result] = await db.query(deleteQuery, [id])
  return {
    success: true,
    message: "Parroquia eliminada exitosamente ss"
  }
}

// Obtener una parroquia por ID
export const getParishById = async (id: number) => {
  const query = `SELECT * FROM parishes WHERE id = ?`
  const [rows] = await db.query(query, [id])
  const data = rows as Parish[];
  return data[0];
}