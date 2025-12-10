import type { APIRoute } from "astro";
import { db } from "@/lib/db";

export const POST: APIRoute = async ({ params }) => {
  const { id } = params;

  if (!id) {
    return new Response(
      JSON.stringify({ success: false, error: "ID de convivencia requerido" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const convivenciaId = Number(id);
    if (Number.isNaN(convivenciaId)) {
      return new Response(
        JSON.stringify({ success: false, error: "ID de convivencia inválido" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    await db.query("UPDATE convivencias SET status = 'finalizada' WHERE id = ?", [
      convivenciaId,
    ]);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error al finalizar convivencia:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Error al finalizar convivencia" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
