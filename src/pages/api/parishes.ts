import type { APIRoute } from "astro";
import { db } from "@/lib/db";

// GET - Obtener todas las parroquias
export const GET: APIRoute = async () => {
  try {
    const [rows] = await db.query('SELECT id, name, tag, aka FROM parishes');

    return new Response(JSON.stringify({
      success: true,
      data: rows
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

// POST - Registrar una nueva parroquia
export const POST: APIRoute = async ({ request }) => {
  try {
    let body;
    const contentType = request.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const text = await request.text();
      console.log('Body raw:', text);

      if (!text || text.trim() === '') {
        return new Response(JSON.stringify({
          success: false,
          error: 'No se recibieron datos'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      body = JSON.parse(text);
    } else {
      // Si es form data
      const formData = await request.formData();
      body = {
        name: formData.get('parish-name'),
        tag: formData.get('parish-tag'),
        aka: formData.get('parish-aka')
      };
    }

    console.log('Body recibido:', body);

    const { name, tag, aka } = body;

    // Validar que los campos requeridos estén presentes
    if (!name || !tag || !aka) {
      console.log('Campos faltantes - name:', name, 'tag:', tag, 'aka:', aka);
      return new Response(JSON.stringify({
        success: false,
        error: 'Todos los campos son requeridos'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Insertar la nueva parroquia
    const [result] = await db.query(
      'INSERT INTO parishes (name, tag, aka) VALUES (?, ?, ?)',
      [name, tag, aka]
    );

    // Obtener el ID insertado
    const insertId = (result as any).insertId;

    // Obtener la parroquia recién creada
    const [rows] = await db.query(
      'SELECT id, name, tag, aka FROM parishes WHERE id = ?',
      [insertId]
    );

    const newParish = (rows as any[])[0];

    return new Response(JSON.stringify({
      success: true,
      data: newParish
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error en POST /api/parishes:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error al registrar la parroquia',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
