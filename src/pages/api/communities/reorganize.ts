import type { APIRoute } from "astro";
import { db } from "@/lib/db";

/**
 * Endpoint para reorganizar números de comunidades en una parroquia
 * POST /api/communities/reorganize
 * 
 * Body: {
 *   parishId: number,
 *   updates: Array<{ communityId: number, newNumber: number }>
 * }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { parishId, updates } = body;

    if (!parishId || !updates || !Array.isArray(updates)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Datos inválidos. Se requiere parishId y updates[]",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Iniciar transacción
    await db.query("START TRANSACTION");

    try {
      // Actualizar cada comunidad
      for (const update of updates) {
        const { communityId, newNumber } = update;

        // Verificar que la comunidad pertenece a la parroquia
        const [community]: any = await db.query(
          "SELECT id FROM communities WHERE id = ? AND parish_id = ?",
          [communityId, parishId],
        );

        if (!community || community.length === 0) {
          throw new Error(
            `Comunidad ${communityId} no encontrada en la parroquia`,
          );
        }

        // Actualizar el número
        await db.query(
          "UPDATE communities SET number_community = ? WHERE id = ?",
          [newNumber, communityId],
        );
      }

      // Confirmar transacción
      await db.query("COMMIT");

      return new Response(
        JSON.stringify({
          success: true,
          message: "Comunidades reorganizadas exitosamente",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      // Revertir cambios si hay error
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error en POST /api/communities/reorganize:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error al reorganizar comunidades: " + (error as Error).message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
