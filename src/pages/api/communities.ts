import type { APIRoute } from "astro";
import { db } from "@/lib/db";

// POST - Crear una nueva comunidad
export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get("content-type") || "";
    let body: any;

    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      const formData = await request.formData();
      body = {
        parish_id: formData.get("parish-id"),
        number_community: formData.get("number-comm"),
        level_paso: formData.get("level-comm"),
      };
    }

    const parishId = Number(body?.parish_id);
    const numberCommunity = Number(body?.number_community);
    const levelPaso = body?.level_paso ? String(body.level_paso) : null;

    if (!parishId || Number.isNaN(parishId) || !numberCommunity || Number.isNaN(numberCommunity) || !levelPaso) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Campos requeridos: parish_id, number_community, level_paso",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Verificar que la parroquia exista
    const [parishRows]: any = await db.query("SELECT id FROM parishes WHERE id = ?", [parishId]);
    if (!parishRows || parishRows.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Parroquia no encontrada" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // Insertar comunidad
    const [result]: any = await db.query(
      "INSERT INTO communities (number_community, parish_id, level_paso) VALUES (?, ?, ?)",
      [numberCommunity, parishId, levelPaso],
    );

    const insertedId = result?.insertId;

    const [rows]: any = await db.query(
      "SELECT id, number_community, parish_id, level_paso FROM communities WHERE id = ?",
      [insertedId],
    );

    return new Response(
      JSON.stringify({ success: true, data: rows?.[0] ?? null }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    // Manejo de error por duplicado (unique_community_per_parish)
    if (error?.code === "ER_DUP_ENTRY") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Ya existe una comunidad con ese número en esta parroquia",
        }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      );
    }

    console.error("Error en POST /api/communities:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error al crear la comunidad",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
