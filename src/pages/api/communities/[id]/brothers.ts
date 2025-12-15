import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { autoInviteBrotherToActiveConvivencia } from "@/services/convivencias";

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ID de comunidad requerido",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const communityId = Number(id);
    if (!Number.isFinite(communityId) || communityId <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ID de comunidad inválido",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const [communityRows]: any = await db.query(
      "SELECT id FROM communities WHERE id = ?",
      [communityId],
    );
    if (!communityRows || communityRows.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "La comunidad no existe",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const body = await request.json();

    const {
      civil_status,
      husband_name,
      wife_name,
      full_name,
      phone,
      husband_phone,
      wife_phone,
      roles_in_own_community,
      catechist_communities,
    } = body;

    if (!civil_status) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Falta el estado civil",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (civil_status === "matrimonio") {
      if (!husband_name || !wife_name) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Para matrimonios se requieren ambos nombres",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
    } else {
      if (!full_name) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Se requiere el nombre completo",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    // Validación: si es catequista, las comunidades de servicio DEBEN existir
    if (catechist_communities && Array.isArray(catechist_communities)) {
      for (const comm of catechist_communities) {
        const parishId = Number(comm?.parish_id);
        const commNumber = Number(comm?.community_number);
        if (!Number.isFinite(parishId) || !Number.isFinite(commNumber)) {
          return new Response(
            JSON.stringify({
              success: false,
              error:
                "Datos inválidos en comunidades de servicio (parroquia o número de comunidad)",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        const [existsRows]: any = await db.query(
          "SELECT id FROM communities WHERE parish_id = ? AND number_community = ? LIMIT 1",
          [parishId, commNumber],
        );

        if (!existsRows || existsRows.length === 0) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `La comunidad ${commNumber} de la parroquia ${parishId} aún no existe`,
            }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }
      }
    }

    // Duplicados en la comunidad
    if (civil_status === "matrimonio") {
      const [existing]: any = await db.query(
        "SELECT id, names FROM brothers WHERE community_id = ? AND names IN (?, ?)",
        [communityId, husband_name, wife_name],
      );
      if (existing.length > 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Alguno de los cónyuges ya está registrado en esta comunidad",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
    } else {
      const [existing]: any = await db.query(
        "SELECT id FROM brothers WHERE names = ? AND community_id = ?",
        [full_name, communityId],
      );
      if (existing.length > 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Este hermano ya está registrado en esta comunidad",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    // Responsable único por comunidad
    if (
      roles_in_own_community &&
      Array.isArray(roles_in_own_community) &&
      roles_in_own_community.includes("responsable")
    ) {
      const [responsables]: any = await db.query(
        'SELECT br.id FROM brother_roles br WHERE br.community_id = ? AND LOWER(br.role) = "responsable"',
        [communityId],
      );

      if (responsables.length > 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Ya existe un responsable en esta comunidad",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    let responsePayload: any = null;

    if (civil_status === "matrimonio") {
      const [husbandResult]: any = await db.query(
        "INSERT INTO brothers (names, civil_status, community_id, phone) VALUES (?, ?, ?, ?)",
        [
          husband_name,
          civil_status,
          communityId,
          husband_phone || phone || null,
        ],
      );
      const husband_id = husbandResult.insertId as number;

      const [wifeResult]: any = await db.query(
        "INSERT INTO brothers (names, civil_status, community_id, phone) VALUES (?, ?, ?, ?)",
        [wife_name, civil_status, communityId, wife_phone || phone || null],
      );
      const wife_id = wifeResult.insertId as number;

      await db.query("UPDATE brothers SET spouse_id = ? WHERE id = ?", [
        wife_id,
        husband_id,
      ]);
      await db.query("UPDATE brothers SET spouse_id = ? WHERE id = ?", [
        husband_id,
        wife_id,
      ]);

      if (roles_in_own_community && Array.isArray(roles_in_own_community)) {
        for (const role of roles_in_own_community) {
          await db.query(
            "INSERT INTO brother_roles (brother_id, community_id, role) VALUES (?, ?, ?)",
            [husband_id, communityId, role],
          );
          await db.query(
            "INSERT INTO brother_roles (brother_id, community_id, role) VALUES (?, ?, ?)",
            [wife_id, communityId, role],
          );
        }
      }

      if (catechist_communities && Array.isArray(catechist_communities)) {
        for (const comm of catechist_communities) {
          const [commExists]: any = await db.query(
            "SELECT id FROM communities WHERE parish_id = ? AND number_community = ? LIMIT 1",
            [comm.parish_id, comm.community_number],
          );

          const serves_community_id = commExists[0].id;

          await db.query(
            'INSERT INTO brother_roles (brother_id, community_id, role) VALUES (?, ?, "catequista")',
            [husband_id, serves_community_id],
          );
          await db.query(
            'INSERT INTO brother_roles (brother_id, community_id, role) VALUES (?, ?, "catequista")',
            [wife_id, serves_community_id],
          );
        }
      }

      try {
        await autoInviteBrotherToActiveConvivencia(husband_id, communityId);
        await autoInviteBrotherToActiveConvivencia(wife_id, communityId);
      } catch (e) {
        console.error(
          "Error al auto-invitar hermanos a convivencia activa (no bloqueante):",
          e,
        );
      }

      const [newBrothers]: any = await db.query(
        "SELECT * FROM brothers WHERE id IN (?, ?)",
        [husband_id, wife_id],
      );

      responsePayload = {
        success: true,
        data: {
          husband: newBrothers.find((b: any) => b.id === husband_id),
          wife: newBrothers.find((b: any) => b.id === wife_id),
        },
        message: "Matrimonio registrado exitosamente",
      };
    } else {
      const [brotherResult]: any = await db.query(
        "INSERT INTO brothers (names, civil_status, community_id, phone) VALUES (?, ?, ?, ?)",
        [full_name, civil_status, communityId, phone || null],
      );

      const brother_id = brotherResult.insertId as number;

      if (roles_in_own_community && Array.isArray(roles_in_own_community)) {
        for (const role of roles_in_own_community) {
          await db.query(
            "INSERT INTO brother_roles (brother_id, community_id, role) VALUES (?, ?, ?)",
            [brother_id, communityId, role],
          );
        }
      }

      if (catechist_communities && Array.isArray(catechist_communities)) {
        for (const comm of catechist_communities) {
          const [commExists]: any = await db.query(
            "SELECT id FROM communities WHERE parish_id = ? AND number_community = ? LIMIT 1",
            [comm.parish_id, comm.community_number],
          );

          const serves_community_id = commExists[0].id;

          await db.query(
            'INSERT INTO brother_roles (brother_id, community_id, role) VALUES (?, ?, "catequista")',
            [brother_id, serves_community_id],
          );
        }
      }

      try {
        await autoInviteBrotherToActiveConvivencia(brother_id, communityId);
      } catch (e) {
        console.error(
          "Error al auto-invitar hermano a convivencia activa (no bloqueante):",
          e,
        );
      }

      const [newBrother]: any = await db.query(
        "SELECT * FROM brothers WHERE id = ?",
        [brother_id],
      );

      responsePayload = {
        success: true,
        data: newBrother[0],
        message: "Hermano registrado exitosamente",
      };
    }

    return new Response(JSON.stringify(responsePayload), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en POST /api/communities/[id]/brothers:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error al registrar el hermano",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
