import type { APIRoute } from "astro";
import { getParishes } from "@/services/parishes";

// GET - Obtener todas las parroquias
export const GET: APIRoute = async () => {
  try {
    const data = await getParishes();
    return new Response(JSON.stringify({
      success: true,
      data: data
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error en GET /api/parishes:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error al obtener las parroquias'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};