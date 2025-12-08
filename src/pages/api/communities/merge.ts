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
 * 2. Transfiere todos los roles a la comunidad destino
 * 3. Elimina las comunidades fuente
 * 4. Opcionalmente reorganiza los números de las comunidades restantes
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

      // 2. Transferir roles de las comunidades fuente a la comunidad destino
      // Primero, eliminar roles duplicados que puedan existir en la comunidad destino
      await db.query(
        `DELETE br1 FROM brother_roles br1
         INNER JOIN brother_roles br2 
         ON br1.brother_id = br2.brother_id 
         AND br1.role = br2.role
         WHERE br1.community_id IN (${sourceIdsPlaceholders})
         AND br2.community_id = ?`,
        [...sourceCommunityIds, targetCommunityId],
      );

      // Luego, transferir los roles restantes
      await db.query(
        `UPDATE brother_roles 
         SET community_id = ? 
         WHERE community_id IN (${sourceIdsPlaceholders})`,
        [targetCommunityId, ...sourceCommunityIds],
      );

      // 3. Eliminar las comunidades fuente
      await db.query(
        `DELETE FROM communities WHERE id IN (${sourceIdsPlaceholders})`,
        sourceCommunityIds,
      );

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
