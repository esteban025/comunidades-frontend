import type { APIRoute } from "astro";
import { db } from "@/lib/db";

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

// PUT - Actualizar un hermano
export const PUT: APIRoute = async ({ params, request }) => {
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
    const [existingBrother] = await db.query(
      "SELECT id FROM brothers WHERE id = ?",
      [id],
    );

    if ((existingBrother as any[]).length === 0) {
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

    const formData = await request.formData();

    const civilStatus = formData.get("civil_status") as string;
    const phone = (formData.get("phone") as string) || null;
    const parishId = formData.get("parish_id") as string;
    const communityNumber = formData.get("community_number") as string;

    // Construir nombres según estado civil
    let names = "";
    if (civilStatus === "matrimonio") {
      const husbandName = formData.get("husband_name") as string;
      const wifeName = formData.get("wife_name") as string;
      names = `${husbandName} y ${wifeName}`;
    } else {
      names = formData.get("full_name") as string;
    }

    if (!names || !civilStatus || !parishId || !communityNumber) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Faltan campos obligatorios",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Buscar o crear la comunidad
    const [communityRows]: any = await db.query(
      `SELECT id, level_paso FROM communities 
       WHERE parish_id = ? AND number_community = ?`,
      [parishId, communityNumber],
    );

    let communityId: number;

    if (communityRows && communityRows.length > 0) {
      communityId = communityRows[0].id;
    } else {
      // Crear nueva comunidad si no existe
      const levelPaso = formData.get("level_paso") as string;
      const [result]: any = await db.query(
        `INSERT INTO communities (parish_id, number_community, level_paso) 
         VALUES (?, ?, ?)`,
        [parishId, communityNumber, levelPaso || null],
      );
      communityId = result.insertId;
    }

    // Actualizar datos básicos del hermano
    await db.query(
      `UPDATE brothers 
       SET names = ?, civil_status = ?, phone = ?, community_id = ?
       WHERE id = ?`,
      [names, civilStatus, phone, communityId, id],
    );

    // Eliminar roles existentes
    await db.query("DELETE FROM brother_roles WHERE brother_id = ?", [id]);

    // Insertar roles en su propia comunidad
    const rolesInOwnCommunity = formData.getAll("roles_in_own_community");
    if (rolesInOwnCommunity && rolesInOwnCommunity.length > 0) {
      for (const role of rolesInOwnCommunity) {
        await db.query(
          `INSERT INTO brother_roles (brother_id, community_id, role) 
           VALUES (?, ?, ?)`,
          [id, communityId, role],
        );
      }
    }

    // Insertar roles de catequista en otras comunidades
    const catechistCount = parseInt(
      (formData.get("catechist_count") as string) || "0",
    );
    for (let i = 0; i < catechistCount; i++) {
      const catCommunityId = formData.get(
        `catechist_community_${i}`,
      ) as string;
      if (catCommunityId) {
        await db.query(
          `INSERT INTO brother_roles (brother_id, community_id, role) 
           VALUES (?, ?, 'catequista')`,
          [id, catCommunityId],
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Hermano actualizado exitosamente",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error en PUT /api/brothers/[id]:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error al actualizar el hermano: " + (error as Error).message,
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
