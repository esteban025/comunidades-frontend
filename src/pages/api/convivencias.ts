import type { APIRoute } from "astro";
import {
  createConvivencia,
  getConvivenciasForDashboard,
  getEligibleBrothersByConvivencia,
} from "@/services/convivencias";

export const GET: APIRoute = async () => {
  try {
    const data = await getConvivenciasForDashboard();
    return new Response(JSON.stringify({ success: true, ...data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en GET /api/convivencias:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error al obtener las convivencias",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const { name, description, start_date, end_date, community_ids } = body;

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

    const newConv = await createConvivencia({
      name,
      description: description || null,
      start_date,
      end_date,
      community_ids: Array.isArray(community_ids) ? community_ids : [],
    });

    const eligible = await getEligibleBrothersByConvivencia(newConv.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: newConv,
        eligible_brothers: eligible,
        message: "Convivencia creada exitosamente",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error en POST /api/convivencias:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error al crear la convivencia",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
