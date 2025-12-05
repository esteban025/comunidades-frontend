import type { APIRoute } from "astro";

// GET - Obtener todas las parroquias
export const GET: APIRoute = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/parishes');
    const result = await response.json();

    if (response.ok) {
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Error al obtener las parroquias'
      }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('Error en GET /api/parishes:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error de conexión con el servidor'
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
    const body = await request.json();

    const parishData = {
      name: body.name,
      tag: body.tag,
      aka: body.aka,
    };

    const response = await fetch('http://localhost:3000/api/parishes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parishData),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return new Response(JSON.stringify({
        success: true,
        data: result.data
      }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: result.message || 'Error al registrar la parroquia'
      }), {
        status: response.status || 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('Error en POST /api/parishes:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error de conexión con el servidor'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
