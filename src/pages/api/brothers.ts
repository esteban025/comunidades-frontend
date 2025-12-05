import type { APIRoute } from "astro";
import { db } from "@/lib/db";

export const prerender = false;

// POST - Registrar un nuevo hermano
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    console.log('Body recibido:', body);

    const {
      civil_status,
      husband_name,
      wife_name,
      full_name,
      phone,
      parish_id,
      community_number,
      level_paso,
      roles_in_own_community,
      catechist_communities
    } = body;

    // 1. Validar campos requeridos
    if (!civil_status || !parish_id || !community_number) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Faltan campos requeridos: estado civil, parroquia y número de comunidad'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // 2. Construir el nombre completo
    let names = '';
    if (civil_status === 'matrimonio') {
      if (!husband_name || !wife_name) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Para matrimonios se requieren ambos nombres'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      names = `${husband_name} y ${wife_name}`;
    } else {
      if (!full_name) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Se requiere el nombre completo'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      names = full_name;
    }

    // 3. Verificar/crear la comunidad del hermano
    let [communities]: any = await db.query(
      'SELECT id, level_paso FROM communities WHERE parish_id = ? AND number_community = ?',
      [parish_id, community_number]
    );

    let community_id;
    if (communities.length === 0) {
      // La comunidad no existe, crearla
      if (!level_paso) {
        return new Response(JSON.stringify({
          success: false,
          error: 'La comunidad no existe. Debes especificar en qué paso está.'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      const [result]: any = await db.query(
        'INSERT INTO communities (parish_id, number_community, level_paso) VALUES (?, ?, ?)',
        [parish_id, community_number, level_paso]
      );
      community_id = result.insertId;
    } else {
      community_id = communities[0].id;
    }

    // 4. Verificar que no exista duplicado en la misma comunidad
    const [existing]: any = await db.query(
      'SELECT id FROM brothers WHERE names = ? AND community_id = ?',
      [names, community_id]
    );

    if (existing.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Este hermano ya está registrado en esta comunidad'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // 5. Si es responsable, validar que no exista otro en la comunidad
    if (roles_in_own_community && roles_in_own_community.includes('responsable')) {
      const [responsables]: any = await db.query(
        'SELECT br.id FROM brother_roles br WHERE br.community_id = ? AND br.role = "responsable"',
        [community_id]
      );

      if (responsables.length > 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Ya existe un responsable en esta comunidad'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // 6. Insertar el hermano
    const [brotherResult]: any = await db.query(
      'INSERT INTO brothers (names, civil_status, community_id, phone) VALUES (?, ?, ?, ?)',
      [names, civil_status, community_id, phone || null]
    );

    const brother_id = brotherResult.insertId;

    // 7. Insertar roles en su propia comunidad
    if (roles_in_own_community && Array.isArray(roles_in_own_community)) {
      for (const role of roles_in_own_community) {
        await db.query(
          'INSERT INTO brother_roles (brother_id, community_id, role) VALUES (?, ?, ?)',
          [brother_id, community_id, role]
        );
      }
    }

    // 8. Si es catequista, insertar roles en otras comunidades
    if (catechist_communities && Array.isArray(catechist_communities)) {
      for (const comm of catechist_communities) {
        // Verificar/crear comunidad donde sirve como catequista
        let [commExists]: any = await db.query(
          'SELECT id FROM communities WHERE parish_id = ? AND number_community = ?',
          [comm.parish_id, comm.community_number]
        );

        let serves_community_id;
        if (commExists.length === 0) {
          // Crear comunidad sin level_paso (se completará después)
          const [newComm]: any = await db.query(
            'INSERT INTO communities (parish_id, number_community, level_paso) VALUES (?, ?, NULL)',
            [comm.parish_id, comm.community_number]
          );
          serves_community_id = newComm.insertId;
        } else {
          serves_community_id = commExists[0].id;
        }

        // Insertar rol de catequista
        await db.query(
          'INSERT INTO brother_roles (brother_id, community_id, role) VALUES (?, ?, "catequista")',
          [brother_id, serves_community_id]
        );
      }
    }

    // 9. Obtener el hermano completo con sus datos
    const [newBrother]: any = await db.query(
      'SELECT * FROM brothers WHERE id = ?',
      [brother_id]
    );

    return new Response(JSON.stringify({
      success: true,
      data: newBrother[0],
      message: 'Hermano registrado exitosamente'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en POST /api/brothers:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error al registrar el hermano',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
