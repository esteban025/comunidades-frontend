import type { APIRoute } from "astro";
import { db } from "@/lib/db";

export const prerender = false;

// GET - Obtener un hermano específico por ID con todos sus detalles
export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    console.log('=== GET /api/brothers/[id] ===');
    console.log('ID recibido:', id);

    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ID de hermano no proporcionado",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Query simplificada - obtener datos básicos del hermano
    const brotherQuery = `
      SELECT 
        b.id,
        b.names,
        b.civil_status,
        b.phone,
        b.community_id,
        c.number_community,
        c.level_paso,
        p.id as parish_id,
        p.name as parish_name,
        p.tag as parish_tag,
        p.aka as parish_aka
      FROM brothers b
      LEFT JOIN communities c ON b.community_id = c.id
      LEFT JOIN parishes p ON c.parish_id = p.id
      WHERE b.id = ?
    `;

    console.log('Ejecutando query principal...');
    const [brotherRows]: any = await db.query(brotherQuery, [id]);
    console.log('Resultado:', brotherRows);

    if (!brotherRows || brotherRows.length === 0) {
      console.log('Hermano no encontrado');
      return new Response(
        JSON.stringify({
          success: false,
          error: "Hermano no encontrado",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const brother = brotherRows[0];
    console.log('Hermano encontrado:', brother.names);

    // Query para obtener TODOS los roles del hermano
    const rolesQuery = `
      SELECT 
        br.role,
        br.community_id,
        c.number_community,
        p.aka as parish_aka
      FROM brother_roles br
      LEFT JOIN communities c ON br.community_id = c.id
      LEFT JOIN parishes p ON c.parish_id = p.id
      WHERE br.brother_id = ?
    `;

    console.log('Obteniendo roles...');
    const [rolesRows]: any = await db.query(rolesQuery, [id]);
    console.log('Roles encontrados:', rolesRows);

    // Separar roles en su comunidad vs catequista de otras
    const rolesInOwnCommunity: string[] = [];
    const catechistOfCommunities: any[] = [];

    rolesRows.forEach((roleRow: any) => {
      if (roleRow.community_id === brother.community_id) {
        // Rol en su propia comunidad (excepto catequista)
        if (roleRow.role !== 'catequista') {
          rolesInOwnCommunity.push(roleRow.role);
        }
      } else if (roleRow.role === 'catequista') {
        // Catequista de otra comunidad
        catechistOfCommunities.push({
          community_id: roleRow.community_id,
          community_number: roleRow.number_community,
          parish_aka: roleRow.parish_aka,
        });
      }
    });

    // Estructurar respuesta
    const brotherData = {
      id: brother.id,
      names: brother.names,
      civil_status: brother.civil_status,
      phone: brother.phone,
      community: {
        id: brother.community_id,
        number: brother.number_community,
        level_paso: brother.level_paso,
      },
      parish: {
        id: brother.parish_id,
        name: brother.parish_name,
        aka: brother.parish_aka,
        tag: brother.parish_tag,
      },
      roles_in_own_community: rolesInOwnCommunity,
      catechist_of_communities: catechistOfCommunities,
    };

    console.log('Respuesta estructurada correctamente');

    return new Response(
      JSON.stringify({
        success: true,
        data: brotherData,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("=== ERROR en GET /api/brothers/[id] ===");
    console.error('Error completo:', error);
    console.error('Stack:', (error as Error).stack);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Error al obtener el hermano: " + (error as Error).message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

// DELETE - Eliminar un hermano
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ID de hermano no proporcionado",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Verificar si el hermano existe
    const [brotherRows] = await db.query(
      "SELECT id, names FROM brothers WHERE id = ?",
      [id],
    );

    if ((brotherRows as any[]).length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Hermano no encontrado",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Eliminar roles del hermano
    await db.query("DELETE FROM brother_roles WHERE brother_id = ?", [id]);

    // Eliminar el hermano
    await db.query("DELETE FROM brothers WHERE id = ?", [id]);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Hermano eliminado exitosamente",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error en DELETE /api/brothers/[id]:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error al eliminar el hermano",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
