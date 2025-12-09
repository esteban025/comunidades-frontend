import type { APIRoute } from "astro";
import { db } from "@/lib/db";

export const GET: APIRoute = async ({ params }) => {
  const { parishId } = params;

  if (!parishId) {
    return new Response(
      JSON.stringify({ success: false, error: "ID de parroquia no proporcionado" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const query = `
      SELECT 
        c.id,
        c.number_community,
        c.level_paso,
        p.name AS parish_name,
        p.aka AS parish_aka,
        (
          SELECT br.names
          FROM brothers br
          INNER JOIN brother_roles brol ON br.id = brol.brother_id
          WHERE brol.community_id = c.id AND brol.role = 'responsable'
          LIMIT 1
        ) AS responsible_name,
        COUNT(b.id) AS total_brothers
      FROM communities c
      INNER JOIN parishes p ON c.parish_id = p.id
      LEFT JOIN brothers b ON c.id = b.community_id
      WHERE c.parish_id = ?
      GROUP BY 
        c.id, 
        c.number_community, 
        c.level_paso,
        p.name,
        p.aka
      ORDER BY c.number_community ASC
    `;

    const [rows]: any = await db.query(query, [parishId]);

    return new Response(
      JSON.stringify({ success: true, data: rows }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error obteniendo comunidades:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Error al obtener comunidades" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
