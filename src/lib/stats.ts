import { db } from "./db";

/**
 * Interfaz para las estadísticas generales
 */
export interface GeneralStats {
  totalBrothers: number;
  totalParishes: number;
  totalCommunities: number;
  totalCatechists: number;
}

/**
 * Obtiene todas las estadísticas generales de la base de datos
 * Usa una sola consulta optimizada para obtener todos los conteos
 */
export async function getGeneralStats(): Promise<GeneralStats> {
  try {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM brothers) as totalBrothers,
        (SELECT COUNT(*) FROM parishes) as totalParishes,
        (SELECT COUNT(*) FROM communities) as totalCommunities,
        (SELECT COUNT(DISTINCT brother_id) FROM brother_roles WHERE role = 'catequista') as totalCatechists
    `;

    const [rows]: any = await db.query(query);
    const result = rows[0];

    return {
      totalBrothers: result.totalBrothers || 0,
      totalParishes: result.totalParishes || 0,
      totalCommunities: result.totalCommunities || 0,
      totalCatechists: result.totalCatechists || 0,
    };
  } catch (error) {
    console.error("Error obteniendo estadísticas generales:", error);
    // Retornar valores por defecto en caso de error
    return {
      totalBrothers: 0,
      totalParishes: 0,
      totalCommunities: 0,
      totalCatechists: 0,
    };
  }
}

/**
 * Obtiene el total de hermanos registrados
 */
export async function getTotalBrothers(): Promise<number> {
  try {
    const query = "SELECT COUNT(*) as total FROM brothers";
    const [rows]: any = await db.query(query);
    return rows[0]?.total || 0;
  } catch (error) {
    console.error("Error obteniendo total de hermanos:", error);
    return 0;
  }
}

/**
 * Obtiene el total de parroquias registradas
 */
export async function getTotalParishes(): Promise<number> {
  try {
    const query = "SELECT COUNT(*) as total FROM parishes";
    const [rows]: any = await db.query(query);
    return rows[0]?.total || 0;
  } catch (error) {
    console.error("Error obteniendo total de parroquias:", error);
    return 0;
  }
}

/**
 * Obtiene el total de comunidades registradas
 */
export async function getTotalCommunities(): Promise<number> {
  try {
    const query = "SELECT COUNT(*) as total FROM communities";
    const [rows]: any = await db.query(query);
    return rows[0]?.total || 0;
  } catch (error) {
    console.error("Error obteniendo total de comunidades:", error);
    return 0;
  }
}

/**
 * Obtiene el total de catequistas únicos
 * Un catequista es cualquier hermano que tiene el rol de 'catequista' en alguna comunidad
 */
export async function getTotalCatechists(): Promise<number> {
  try {
    const query = `
      SELECT COUNT(DISTINCT brother_id) as total 
      FROM brother_roles 
      WHERE role = 'catequista'
    `;
    const [rows]: any = await db.query(query);
    return rows[0]?.total || 0;
  } catch (error) {
    console.error("Error obteniendo total de catequistas:", error);
    return 0;
  }
}

/**
 * Obtiene estadísticas adicionales útiles
 */
export async function getAdditionalStats() {
  try {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM brothers WHERE civil_status = 'matrimonio') as totalMarried,
        (SELECT COUNT(*) FROM brothers WHERE civil_status IN ('soltero', 'soltera')) as totalSingle,
        (SELECT COUNT(DISTINCT brother_id) FROM brother_roles WHERE role = 'responsable') as totalResponsables,
        (SELECT COUNT(DISTINCT brother_id) FROM brother_roles WHERE role = 'corresponsable') as totalCorresponsables,
        (SELECT COUNT(DISTINCT brother_id) FROM brother_roles WHERE role = 'didascala') as totalDidascalas,
        (SELECT COUNT(DISTINCT brother_id) FROM brother_roles WHERE role = 'ostiario') as totalOstiarios
    `;

    const [rows]: any = await db.query(query);
    return rows[0];
  } catch (error) {
    console.error("Error obteniendo estadísticas adicionales:", error);
    return null;
  }
}
