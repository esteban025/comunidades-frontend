import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { getBrother } from "@/services/brothers";

// GET - Obtener todos los hermanos con sus comunidades y roles (con paginación)
export const GET: APIRoute = async ({ url }) => {
  // Obtener parámetros de paginación
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;

  try {
    // 1. Contar total de hermanos
    const [countResult]: any = await db.query(
      'SELECT COUNT(*) as total FROM brothers'
    );
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    const brothers = await getBrother({ limit, offset });

    return new Response(JSON.stringify({
      success: true,
      data: brothers,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        itemsPerPage: limit,
        from: totalItems > 0 ? offset + 1 : 0,
        to: Math.min(offset + limit, totalItems),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error en GET /api/all-brothers:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error al obtener los hermanos',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
