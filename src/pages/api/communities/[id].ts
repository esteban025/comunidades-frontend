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

/**
 * PUT - Actualizar los detalles de una comunidad (número, paso)
 */
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ID de comunidad no proporcionado",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Verificar que la comunidad existe
    const [existingCommunity]: any = await db.query(
      "SELECT id, parish_id FROM communities WHERE id = ?",
      [id],
    );

    if (!existingCommunity || existingCommunity.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Comunidad no encontrada",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const body = await request.json();
    const { number_community, level_paso } = body;

    // Validar campos requeridos
    if (!number_community || !level_paso) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Faltan campos requeridos: number_community, level_paso",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Verificar si ya existe otra comunidad con ese número en la misma parroquia
    const parishId = existingCommunity[0].parish_id;
    const [duplicateCheck]: any = await db.query(
      "SELECT id FROM communities WHERE parish_id = ? AND number_community = ? AND id != ?",
      [parishId, number_community, id],
    );

    if (duplicateCheck && duplicateCheck.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Ya existe una comunidad con el número ${number_community} en esta parroquia`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Actualizar la comunidad
    await db.query(
      "UPDATE communities SET number_community = ?, level_paso = ? WHERE id = ?",
      [number_community, level_paso, id],
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Comunidad actualizada exitosamente",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error en PUT /api/communities/[id]:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error al actualizar comunidad: " + (error as Error).message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

/**
 * DELETE - Eliminar una comunidad (solo si no tiene hermanos)
 */
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ID de comunidad no proporcionado",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Elimaremos a la comunidad
    await db.query('DELETE FROM communities WHERE id = ?', [id]);

    return new Response(JSON.stringify({
      success: true,
      message: 'Comunidad eliminada exitosamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });


  } catch (error) {

    console.error("Error en DELETE /api/communities/[id]:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error al eliminar comunidad: " + (error as Error).message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );

  }
};
