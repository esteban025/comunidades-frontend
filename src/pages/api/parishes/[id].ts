import type { APIRoute } from "astro";
import { db } from "@/lib/db";

export const prerender = false;

// PUT - Actualizar una parroquia
export const PUT: APIRoute = async ({ params, request }) => {
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

    const body = await request.json();
    const { name, tag, aka } = body;

    // Validar campos requeridos
    if (!name || !tag || !aka) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Todos los campos son requeridos'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Actualizar la parroquia
    await db.query(
      'UPDATE parishes SET name = ?, tag = ?, aka = ? WHERE id = ?',
      [name, tag, aka, id]
    );

    // Obtener la parroquia actualizada
    const [rows] = await db.query(
      'SELECT id, name, tag, aka FROM parishes WHERE id = ?',
      [id]
    );

    const updatedParish = (rows as any[])[0];

    if (!updatedParish) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Parroquia no encontrada'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: updatedParish,
      message: 'Parroquia actualizada exitosamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en PUT /api/parishes/[id]:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error al actualizar la parroquia'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE - Eliminar una parroquia
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

    // Verificar si la parroquia tiene comunidades asociadas
    const [communities] = await db.query(
      'SELECT COUNT(*) as count FROM communities WHERE parish_id = ?',
      [id]
    );

    const communityCount = (communities as any[])[0].count;

    if (communityCount > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: `No se puede eliminar la parroquia porque tiene ${communityCount} comunidad(es) asociada(s)`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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
