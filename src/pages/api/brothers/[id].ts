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
        b.spouse_id,
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
        p.id as parish_id,
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
          parish_id: roleRow.parish_id,
          parish_aka: roleRow.parish_aka,
        });
      }
    });

    // Estructurar respuesta
    let spouseData: any = null;
    if (brother.civil_status === "matrimonio" && brother.spouse_id) {
      const [spouseRows]: any = await db.query(
        `SELECT id, names, phone FROM brothers WHERE id = ?`,
        [brother.spouse_id],
      );
      if (spouseRows && spouseRows.length > 0) {
        spouseData = spouseRows[0];
      }
    }

    const brotherData = {
      id: brother.id,
      names: brother.names,
      civil_status: brother.civil_status,
      phone: brother.phone,
      spouse_id: brother.spouse_id,
      spouse: spouseData,
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

    // Verificar si el hermano existe (y si tiene spouse)
    const [existingBrotherRows]: any = await db.query(
      "SELECT id, spouse_id, names, civil_status FROM brothers WHERE id = ?",
      [id],
    );

    if (!existingBrotherRows || existingBrotherRows.length === 0) {
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

    const existingBrother = existingBrotherRows[0] as {
      id: number;
      spouse_id?: number | null;
      names: string;
      civil_status: string;
    };

    const formData = await request.formData();

    const civilStatus = (formData.get("civil_status") as string) || existingBrother.civil_status;
    const phone = (formData.get("phone") as string) || null;
    const husbandPhone = (formData.get("husband_phone") as string) || null;
    const wifePhone = (formData.get("wife_phone") as string) || null;
    const parishId = formData.get("parish_id") as string;
    const communityNumber = formData.get("community_number") as string;

    if (!civilStatus || !parishId || !communityNumber) {
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

    const idsToUpdate: number[] = [parseInt(id)];
    if (existingBrother.spouse_id) idsToUpdate.push(existingBrother.spouse_id);

    if (civilStatus === "matrimonio" && existingBrother.spouse_id) {
      const husbandName = ((formData.get("husband_name") as string) || "").trim();
      const wifeName = ((formData.get("wife_name") as string) || "").trim();

      if (!husbandName || !wifeName) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Para matrimonios se requieren ambos nombres",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Determinar cuál registro corresponde a cada nombre según datos actuales.
      const [spouseRows]: any = await db.query(
        "SELECT id, names FROM brothers WHERE id IN (?, ?)",
        [parseInt(id), existingBrother.spouse_id],
      );

      const currentRow = spouseRows.find((r: any) => r.id === parseInt(id));
      const spouseRow = spouseRows.find((r: any) => r.id === existingBrother.spouse_id);

      let husbandId = parseInt(id);
      let wifeId = existingBrother.spouse_id;

      if (currentRow && currentRow.names === wifeName) {
        wifeId = parseInt(id);
        husbandId = existingBrother.spouse_id;
      } else if (spouseRow && spouseRow.names === wifeName) {
        husbandId = parseInt(id);
        wifeId = existingBrother.spouse_id;
      }

      // Actualizar ambos registros (nombres y teléfonos separados)
      await db.query(
        `UPDATE brothers 
         SET names = ?, civil_status = ?, phone = ?, community_id = ?
         WHERE id = ?`,
        [husbandName, civilStatus, husbandPhone, communityId, husbandId],
      );
      await db.query(
        `UPDATE brothers 
         SET names = ?, civil_status = ?, phone = ?, community_id = ?
         WHERE id = ?`,
        [wifeName, civilStatus, wifePhone, communityId, wifeId],
      );

      // Eliminar roles existentes de ambos
      await db.query(
        `DELETE FROM brother_roles WHERE brother_id IN (${idsToUpdate
          .map(() => "?")
          .join(",")})`,
        idsToUpdate,
      );

      // Insertar roles en su propia comunidad para ambos
      const rolesInOwnCommunity = formData.getAll("roles_in_own_community");
      if (rolesInOwnCommunity && rolesInOwnCommunity.length > 0) {
        for (const role of rolesInOwnCommunity) {
          await db.query(
            `INSERT INTO brother_roles (brother_id, community_id, role) 
             VALUES (?, ?, ?)`,
            [husbandId, communityId, role],
          );
          await db.query(
            `INSERT INTO brother_roles (brother_id, community_id, role) 
             VALUES (?, ?, ?)`,
            [wifeId, communityId, role],
          );
        }
      }

      // Insertar roles de catequista en otras comunidades para ambos
      // Convención esperada desde el frontend: catechist_parish_i + catechist_community_i (número de comunidad)
      const catechistCount = parseInt(
        (formData.get("catechist_count") as string) || "0",
      );
      for (let i = 0; i < catechistCount; i++) {
        const catParishId = (formData.get(`catechist_parish_${i}`) as string) || "";
        const catCommunityNumber = (formData.get(`catechist_community_${i}`) as string) || "";
        if (!catParishId || !catCommunityNumber) continue;

        // Buscar/crear comunidad de servicio
        const [catCommunityRows]: any = await db.query(
          `SELECT id FROM communities WHERE parish_id = ? AND number_community = ? LIMIT 1`,
          [catParishId, catCommunityNumber],
        );

        let servesCommunityId: number;
        if (catCommunityRows && catCommunityRows.length > 0) {
          servesCommunityId = catCommunityRows[0].id;
        } else {
          const [insertCatCommunityResult]: any = await db.query(
            `INSERT INTO communities (parish_id, number_community, level_paso) VALUES (?, ?, NULL)`,
            [catParishId, catCommunityNumber],
          );
          servesCommunityId = insertCatCommunityResult.insertId;
        }

        await db.query(
          `INSERT INTO brother_roles (brother_id, community_id, role) VALUES (?, ?, 'catequista')`,
          [husbandId, servesCommunityId],
        );
        await db.query(
          `INSERT INTO brother_roles (brother_id, community_id, role) VALUES (?, ?, 'catequista')`,
          [wifeId, servesCommunityId],
        );
      }
    } else {
      const names = (formData.get("full_name") as string) || "";
      if (!names) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Se requiere el nombre completo",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
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
      // Convención esperada desde el frontend: catechist_parish_i + catechist_community_i (número de comunidad)
      const catechistCount = parseInt(
        (formData.get("catechist_count") as string) || "0",
      );
      for (let i = 0; i < catechistCount; i++) {
        const catParishId = (formData.get(`catechist_parish_${i}`) as string) || "";
        const catCommunityNumber = (formData.get(`catechist_community_${i}`) as string) || "";
        if (!catParishId || !catCommunityNumber) continue;

        const [catCommunityRows]: any = await db.query(
          `SELECT id FROM communities WHERE parish_id = ? AND number_community = ? LIMIT 1`,
          [catParishId, catCommunityNumber],
        );

        let servesCommunityId: number;
        if (catCommunityRows && catCommunityRows.length > 0) {
          servesCommunityId = catCommunityRows[0].id;
        } else {
          const [insertCatCommunityResult]: any = await db.query(
            `INSERT INTO communities (parish_id, number_community, level_paso) VALUES (?, ?, NULL)`,
            [catParishId, catCommunityNumber],
          );
          servesCommunityId = insertCatCommunityResult.insertId;
        }

        await db.query(
          `INSERT INTO brother_roles (brother_id, community_id, role) VALUES (?, ?, 'catequista')`,
          [id, servesCommunityId],
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

    // Verificar si el hermano existe y obtener a su cónyuge (si aplica)
    const [brotherRows]: any = await db.query(
      "SELECT id, names, spouse_id FROM brothers WHERE id = ?",
      [id],
    );

    if (!brotherRows || brotherRows.length === 0) {
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

    const brother = brotherRows[0] as { id: number; names: string; spouse_id?: number | null };

    // Construir lista de IDs a eliminar: hermano y, si existe, su cónyuge
    const idsToDelete: number[] = [brother.id];

    if (brother.spouse_id) {
      idsToDelete.push(brother.spouse_id);
    }

    // Eliminar roles de todos los hermanos afectados
    await db.query(
      `DELETE FROM brother_roles WHERE brother_id IN (${idsToDelete
        .map(() => "?")
        .join(",")})`,
      idsToDelete,
    );

    // Eliminar hermanos (otros registros dependientes usan ON DELETE CASCADE)
    await db.query(
      `DELETE FROM brothers WHERE id IN (${idsToDelete.map(() => "?").join(",")})`,
      idsToDelete,
    );

    return new Response(
      JSON.stringify({
        success: true,
        message:
          idsToDelete.length > 1
            ? "Matrimonio eliminado exitosamente"
            : "Hermano eliminado exitosamente",
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
