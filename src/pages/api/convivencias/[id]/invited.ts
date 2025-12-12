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
    const { brother_ids } = body || {};

    if (!Array.isArray(brother_ids) || brother_ids.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Faltan brother_ids" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    await db.query("START TRANSACTION");

    try {
      const values = brother_ids.map(() => "(?, ?)").join(", ");
      const insertQuery = `
        INSERT IGNORE INTO convivencia_invited (convivencia_id, brother_id)
        VALUES ${values}
      `;

      const paramsArray: any[] = [];
      brother_ids.forEach((id: number) => {
        paramsArray.push(convivenciaId, id);
      });

      await db.query(insertQuery, paramsArray);

      await db.query("COMMIT");
    } catch (err) {
      await db.query("ROLLBACK");
      throw err;
    }

    return new Response(
      JSON.stringify({ success: true, message: "Invitados agregados" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error en POST /api/convivencias/[id]/invited:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Error al agregar invitados" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
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
    const { brother_ids } = body || {};

    if (!Array.isArray(brother_ids) || brother_ids.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Faltan brother_ids" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const ids = brother_ids
      .map((id: any) => Number(id))
      .filter((id: number) => !Number.isNaN(id));

    if (ids.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "brother_ids inválidos" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    await db.query("START TRANSACTION");

    try {
      const placeholders = ids.map(() => "?").join(", ");
      const deleteQuery = `
        DELETE FROM convivencia_invited
        WHERE convivencia_id = ?
          AND brother_id IN (${placeholders})
      `;

      await db.query(deleteQuery, [convivenciaId, ...ids]);

      await db.query("COMMIT");
    } catch (err) {
      await db.query("ROLLBACK");
      throw err;
    }

    return new Response(
      JSON.stringify({ success: true, message: "Invitado(s) eliminado(s)" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error en DELETE /api/convivencias/[id]/invited:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Error al eliminar invitado(s)" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
