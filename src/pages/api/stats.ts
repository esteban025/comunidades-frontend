import type { APIRoute } from "astro";
import { getGeneralStats } from "@/lib/stats";

export const prerender = false;

/**
 * GET /api/stats
 * Obtiene todas las estadísticas generales del sistema
 */
export const GET: APIRoute = async () => {
  try {
    const stats = await getGeneralStats();

    return new Response(
      JSON.stringify({
        success: true,
        data: stats,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error en GET /api/stats:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error al obtener las estadísticas",
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
