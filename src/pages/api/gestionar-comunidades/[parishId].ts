import type { APIRoute } from "astro";
import { db } from "@/lib/db";

export const GET: APIRoute = async ({ params }) => {
  const { parishId } = params;

  if (!parishId) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "ID de parroquia no proporcionado",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const parsedParishId = Number(parishId);
  if (Number.isNaN(parsedParishId) || parsedParishId <= 0) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "ID de parroquia inválido",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const query = `
      SELECT
        c.id,
        c.number_community,
        c.level_paso,
        COUNT(DISTINCT b.id) AS total_brothers
      FROM communities c
      LEFT JOIN brothers b ON c.id = b.community_id
      WHERE c.parish_id = ?
      GROUP BY c.id, c.number_community, c.level_paso
      ORDER BY c.number_community ASC
    `;

    const [rows]: any = await db.query(query, [parsedParishId]);

    return new Response(JSON.stringify({ success: true, data: rows }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error obteniendo comunidades (gestionar-comunidades):", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error al obtener comunidades",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
