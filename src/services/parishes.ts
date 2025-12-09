import { db } from "@/lib/db";
import type { Parish } from "@/types/parishes";

// Obtener todas las parroquias
export const getParishes = async (): Promise<Parish[]> => {
  const query = "SELECT id, name, tag, aka FROM parishes ORDER BY name ASC";
  const [rows] = await db.query(query)
  const data: Parish[] = rows as Parish[];
  return data;
}


// Crear una nueva parroquia
interface Params {
  name: string;
  tag: string;
  aka: string;
}

export const createParish = async (params: Params) => {
  const { name, tag, aka } = params;
  const insertQuery = 'INSERT INTO parishes (name, tag, aka) VALUES (?, ?, ?)';
  const [result] = await db.query(insertQuery, [name, tag, aka]);
  const insertId = (result as any).insertId;

  const selectQuery = 'SELECT id, name, tag, aka FROM parishes WHERE id = ?';
  const [rows] = await db.query(selectQuery, [insertId]);
  const newParish = (rows as any[])[0];
  return newParish;
}