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
    const { brother_id, observations } = body || {};

    if (!brother_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Falta brother_id" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    await db.query("START TRANSACTION");

    try {
      const insertQuery = `
        INSERT IGNORE INTO convivencia_attendees (convivencia_id, brother_id, observations)
        VALUES (?, ?, ?)
      `;
      await db.query(insertQuery, [
        convivenciaId,
        brother_id,
        observations ?? null,
      ]);

      const deleteQuery = `
        DELETE FROM convivencia_invited
        WHERE convivencia_id = ? AND brother_id = ?
      `;
      await db.query(deleteQuery, [convivenciaId, brother_id]);

      await db.query("COMMIT");
    } catch (err) {
      await db.query("ROLLBACK");
      throw err;
    }

    return new Response(
      JSON.stringify({ success: true, message: "Asistencia confirmada" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error en POST /api/convivencias/[id]/attendees:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Error al confirmar asistencia" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
