import type { APIRoute } from "astro";
import { getCommunityByIdParis } from "@/services/communities";

export const GET: APIRoute = async ({ params }) => {
  const { parishId } = params;

  if (!parishId) {
    return new Response(
      JSON.stringify({ success: false, error: "ID de parroquia no proporcionado" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const communities = await getCommunityByIdParis(Number(parishId));
    console.log(communities);
    return new Response(
      JSON.stringify({ success: true, data: communities }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.error("Error fetching communities by parish ID:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Error al obtener las comunidades" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
