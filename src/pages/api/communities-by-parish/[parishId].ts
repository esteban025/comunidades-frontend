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
      SELECT id, number_community, level_paso
      FROM communities
      WHERE parish_id = ?
      ORDER BY number_community ASC
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
