import type { APIRoute } from "astro";
import { db } from "@/lib/db";

// GET - Obtener detalles completos de una comunidad
export const GET: APIRoute = async ({ params }) => {
  const { id } = params;

  if (!id) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "ID de comunidad requerido",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // 1. Obtener información básica de la comunidad
    const communityQuery = `
      SELECT 
        c.id,
        c.number_community,
        c.level_paso,
        p.name as parish_name,
        p.aka as parish_aka,
        COUNT(DISTINCT b.id) as total_brothers
      FROM communities c
      INNER JOIN parishes p ON c.parish_id = p.id
      LEFT JOIN brothers b ON c.id = b.community_id
      WHERE c.id = ?
      GROUP BY c.id, c.number_community, c.level_paso, p.name, p.aka
    `;

    const [communityRows]: any = await db.query(communityQuery, [id]);

    if (!communityRows || communityRows.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Comunidad no encontrada",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const community = communityRows[0];

    // 2. Obtener responsables
    const responsablesQuery = `
      SELECT 
        b.id,
        b.names,
        b.phone
      FROM brothers b
      INNER JOIN brother_roles br ON b.id = br.brother_id
      WHERE br.community_id = ? AND br.role = 'Responsable'
    `;

    const [responsablesRows]: any = await db.query(responsablesQuery, [id]);

    // 3. Obtener corresponsables
    const corresponsablesQuery = `
      SELECT 
        b.id,
        b.names,
        b.phone
      FROM brothers b
      INNER JOIN brother_roles br ON b.id = br.brother_id
      WHERE br.community_id = ? AND br.role = 'Corresponsable'
    `;

    const [corresponsablesRows]: any = await db.query(corresponsablesQuery, [id]);

    // 4. Obtener catequistas
    const catequistasQuery = `
      SELECT 
        b.id,
        b.names,
        b.phone
      FROM brothers b
      INNER JOIN brother_roles br ON b.id = br.brother_id
      WHERE br.community_id = ? AND br.role = 'Catequista'
    `;

    const [catequistasRows]: any = await db.query(catequistasQuery, [id]);

    // 5. Obtener otros hermanos con roles (ostiario, didascala, etc.) - sin catequistas
    const otherBrothersQuery = `
      SELECT 
        b.id,
        b.names,
        b.phone,
        GROUP_CONCAT(br.role SEPARATOR ', ') as roles
      FROM brothers b
      INNER JOIN brother_roles br ON b.id = br.brother_id
      WHERE br.community_id = ? 
        AND br.role NOT IN ('Responsable', 'Corresponsable', 'Catequista')
      GROUP BY b.id, b.names, b.phone
    `;

    const [otherBrothersRows]: any = await db.query(otherBrothersQuery, [id]);

    // Formatear roles en array
    const otherBrothers = otherBrothersRows?.map((brother: any) => ({
      ...brother,
      roles: brother.roles ? brother.roles.split(', ') : [],
    })) || [];

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...community,
          responsables: responsablesRows || [],
          corresponsables: corresponsablesRows || [],
          catequistas: catequistasRows || [],
          other_brothers: otherBrothers,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error obteniendo detalles de comunidad:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error al obtener los detalles de la comunidad",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
