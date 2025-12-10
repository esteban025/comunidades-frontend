import type { APIRoute } from "astro";
import { db } from "@/lib/db";

export const POST: APIRoute = async ({ params, request }) => {
  const convivenciaId = Number(params.id);

  if (!convivenciaId || Number.isNaN(convivenciaId)) {
    return new Response(
      JSON.stringify({ success: false, error: "ID de convivencia inválido" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const body = await request.json();
    const { attended_ids, not_attended_ids } = body || {};

    if (
      !Array.isArray(attended_ids) &&
      !Array.isArray(not_attended_ids)
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Se requiere al menos una lista de asistentes",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    await db.query("START TRANSACTION");

    try {
      if (Array.isArray(attended_ids) && attended_ids.length > 0) {
        const placeholders = attended_ids.map(() => "?").join(", ");
        const sql = `
          UPDATE convivencia_attendees
          SET attended = 1
          WHERE convivencia_id = ? AND brother_id IN (${placeholders})
        `;
        await db.query(sql, [convivenciaId, ...attended_ids]);
      }

      if (Array.isArray(not_attended_ids) && not_attended_ids.length > 0) {
        const placeholders = not_attended_ids.map(() => "?").join(", ");
        const sql = `
          UPDATE convivencia_attendees
          SET attended = 0
          WHERE convivencia_id = ? AND brother_id IN (${placeholders})
        `;
        await db.query(sql, [convivenciaId, ...not_attended_ids]);
      }

      await db.query("COMMIT");
    } catch (err) {
      await db.query("ROLLBACK");
      throw err;
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error en POST /api/convivencias/[id]/attended:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Error al actualizar asistencia" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
