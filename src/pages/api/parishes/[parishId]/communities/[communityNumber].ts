import type { APIRoute } from "astro";
import { db } from "@/lib/db";

export const prerender = false;

/**
 * GET /api/parishes/[parishId]/communities/[communityNumber]
 * Verifica si una comunidad específica existe en una parroquia
 */
export const GET: APIRoute = async ({ params }) => {
  const { parishId, communityNumber } = params;

  if (!parishId || !communityNumber) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Faltan parámetros requeridos",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    const query = `
      SELECT id, number_community, level_paso, parish_id
      FROM communities
      WHERE parish_id = ? AND number_community = ?
      LIMIT 1
    `;

    const [rows]: any = await db.query(query, [parishId, communityNumber]);

    if (rows.length > 0) {
      return new Response(
        JSON.stringify({
          success: true,
          exists: true,
          data: {
            id: rows[0].id,
            number: rows[0].number_community,
            level_paso: rows[0].level_paso,
            parish_id: rows[0].parish_id,
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: true,
          exists: false,
          message: "La comunidad no existe",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  } catch (error) {
    console.error("Error verificando comunidad:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error al verificar la comunidad",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
