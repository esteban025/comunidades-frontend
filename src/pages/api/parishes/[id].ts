import type { APIRoute } from "astro";
import { db } from "@/lib/db";

// DELETE - Eliminar una parroquia (y sus comunidades asociadas)
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ID de parroquia no proporcionado'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Eliminar comunidades asociadas a la parroquia
    await db.query('DELETE FROM communities WHERE parish_id = ?', [id]);

    // Eliminar la parroquia
    await db.query('DELETE FROM parishes WHERE id = ?', [id]);

    return new Response(JSON.stringify({
      success: true,
      message: 'Parroquia eliminada exitosamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en DELETE /api/parishes/[id]:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error al eliminar la parroquia'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
