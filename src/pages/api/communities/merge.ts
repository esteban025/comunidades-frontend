import type { APIRoute } from "astro";
import { db } from "@/lib/db";

/**
 * Endpoint para fusionar dos o más comunidades
 * POST /api/communities/merge
 * 
 * Body: {
 *   targetCommunityId: number,  // Comunidad que se mantendrá
 *   sourceCommunityIds: number[], // Comunidades que se fusionarán (se eliminarán)
 * }
 * 
 * Proceso:
 * 1. Transfiere todos los hermanos de las comunidades fuente a la comunidad destino
 * 2. Elimina todos los roles (brother_roles) tanto de la comunidad destino como de las comunidades fuente
 * 3. Elimina las comunidades fuente
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { targetCommunityId, sourceCommunityIds } = body;

    if (
      !targetCommunityId ||
      !sourceCommunityIds ||
      !Array.isArray(sourceCommunityIds) ||
      sourceCommunityIds.length === 0
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Datos inválidos. Se requiere targetCommunityId y sourceCommunityIds[]",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Verificar que no intenten fusionar una comunidad consigo misma
    if (sourceCommunityIds.includes(targetCommunityId)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No se puede fusionar una comunidad consigo misma",
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
      // Verificar que la comunidad destino existe
      const [targetCommunity]: any = await db.query(
        "SELECT id, parish_id FROM communities WHERE id = ?",
        [targetCommunityId],
      );

      if (!targetCommunity || targetCommunity.length === 0) {
        throw new Error("Comunidad destino no encontrada");
      }

      const parishId = targetCommunity[0].parish_id;

      // Verificar que todas las comunidades fuente existen y son de la misma parroquia
      for (const sourceId of sourceCommunityIds) {
        const [sourceCommunity]: any = await db.query(
          "SELECT id, parish_id FROM communities WHERE id = ?",
          [sourceId],
        );

        if (!sourceCommunity || sourceCommunity.length === 0) {
          throw new Error(`Comunidad ${sourceId} no encontrada`);
        }

        if (sourceCommunity[0].parish_id !== parishId) {
          throw new Error(
            `La comunidad ${sourceId} no pertenece a la misma parroquia`,
          );
        }
      }

      // 1. Transferir hermanos de las comunidades fuente a la comunidad destino
      const sourceIdsPlaceholders = sourceCommunityIds.map(() => "?").join(",");
      await db.query(
        `UPDATE brothers 
         SET community_id = ? 
         WHERE community_id IN (${sourceIdsPlaceholders})`,
        [targetCommunityId, ...sourceCommunityIds],
      );

      // 2. Eliminar roles de la comunidad destino y de las comunidades fuente
      // Regla de negocio: después de la fusión, no debe quedar ningún rol asignado.
      await db.query(
        `DELETE FROM brother_roles WHERE community_id = ? OR community_id IN (${sourceIdsPlaceholders})`,
        [targetCommunityId, ...sourceCommunityIds],
      );

      // 3. Eliminar las comunidades fuente
      await db.query(
        `DELETE FROM communities WHERE id IN (${sourceIdsPlaceholders})`,
        sourceCommunityIds,
      );

      // 4. Reorganizar números de comunidades restantes en la parroquia (1..N sin saltos)
      // Se hace en el servidor para mantener el cliente simple.
      const [remainingRows]: any = await db.query(
        "SELECT id, number_community FROM communities WHERE parish_id = ? ORDER BY number_community ASC",
        [parishId],
      );

      // Para evitar colisiones por índice único (si existe), renumeramos en 2 fases:
      // 1) asignar un rango temporal alto
      // 2) asignar el rango final 1..N
      if (Array.isArray(remainingRows) && remainingRows.length > 0) {
        const tempBase = 100000;
        for (let i = 0; i < remainingRows.length; i++) {
          const row = remainingRows[i];
          await db.query(
            "UPDATE communities SET number_community = ? WHERE id = ?",
            [tempBase + i, row.id],
          );
        }

        for (let i = 0; i < remainingRows.length; i++) {
          const row = remainingRows[i];
          await db.query(
            "UPDATE communities SET number_community = ? WHERE id = ?",
            [i + 1, row.id],
          );
        }
      }

      // Confirmar transacción
      await db.query("COMMIT");

      return new Response(
        JSON.stringify({
          success: true,
          message: `${sourceCommunityIds.length} comunidad(es) fusionada(s) exitosamente`,
          data: {
            targetCommunityId,
            mergedCommunityIds: sourceCommunityIds,
            parishId,
          },
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
    console.error("Error en POST /api/communities/merge:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error al fusionar comunidades: " + (error as Error).message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
