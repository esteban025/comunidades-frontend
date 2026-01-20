import { db } from "@/lib/db";
import type { Parish } from "@/types/parishes";

// Obtener todas las parroquias
export const getParishes = async (): Promise<Parish[]> => {
  const query = "SELECT * FROM parishes ORDER BY name ASC";
  const [rows] = await db.query(query)
  const data: Parish[] = rows as Parish[];
  return data;
}

export const getParishByTag = async (tag: string): Promise<Parish[]> => {
  const query = `SELECT id, name, tag, aka FROM parishes WHERE tag = ?`
  const [rows] = await db.query(query, [tag])
  const data: Parish[] = rows as Parish[]
  return data
}

export const getParishById = async (id: number): Promise<Parish[]> => {
  const query = `SELECT id, name, tag, aka FROM parishes WHERE id = ?`
  const [rows] = await db.query(query, [id])
  const data: Parish[] = rows as Parish[]
  return data
}

// Crear una nueva parroquia

interface CreateParishResult {
  success: boolean;
  duplicated: boolean;
  error: string | null;
  parish?: Parish;
}

export const createParish = async (params: Omit<Parish, "id">): Promise<CreateParishResult> => {
  const { name, tag, aka } = params;

  try {
    // Comprobar si ya existe una parroquia con el mismo tag
    const existing = await getParishByTag(tag);
    if (existing.length > 0) {
      return {
        success: false,
        duplicated: true,
        error: null,
      };
    }

    const insertQuery = "INSERT INTO parishes (name, tag, aka) VALUES (?, ?, ?)";
    const [result] = await db.query(insertQuery, [name, tag, aka]);
    const insertId = (result as any).insertId;

    const selectQuery = "SELECT id, name, tag, aka FROM parishes WHERE id = ?";
    const [rows] = await db.query(selectQuery, [insertId]);
    const newParish = (rows as any[])[0] as Parish;

    return {
      success: true,
      duplicated: false,
      error: null,
      parish: newParish,
    };
  } catch (err) {
    return {
      success: false,
      duplicated: false,
      error:
        err instanceof Error
          ? err.message
          : "Error desconocido al crear la parroquia",
    };
  }
};

export const updateParish = async (id: number, data: Omit<Parish, "id">) => {
  const { name, tag, aka } = data
  const query = `UPDATE parishes SET name = ?, tag = ?, aka = ? WHERE id = ?`
  const [result] = await db.query(query, [name, tag, aka, id])
  return result
}