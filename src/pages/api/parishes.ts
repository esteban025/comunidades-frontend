import type { APIRoute } from "astro";
import { createParish, getParishes } from "@/services/parishes";

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

    const newParish = await createParish({ name, tag, aka });

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
