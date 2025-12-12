import type { APIRoute } from "astro";
import {
  getConvivenciaDetails,
  updateConvivencia,
} from "@/services/convivencias";

export const GET: APIRoute = async ({ params }) => {
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
    const data = await getConvivenciaDetails(convivenciaId);

    if (!data) {
      return new Response(
        JSON.stringify({ success: false, error: "Convivencia no encontrada" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en GET /api/convivencias/[id]:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Error al obtener la convivencia" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
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
    const { name, description, start_date, end_date, community_ids } = body || {};

    if (!name || !start_date || !end_date) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Nombre, fecha de inicio y fecha final son obligatorios",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    await updateConvivencia(convivenciaId, {
      name,
      description: description || null,
      start_date,
      end_date,
      community_ids: Array.isArray(community_ids) ? community_ids : [],
    });

    const updated = await getConvivenciaDetails(convivenciaId);

    return new Response(
      JSON.stringify({
        success: true,
        data: updated,
        message: "Convivencia actualizada exitosamente",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error en PUT /api/convivencias/[id]:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Error al actualizar la convivencia" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
