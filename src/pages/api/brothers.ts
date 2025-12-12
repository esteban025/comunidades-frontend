import type { APIRoute } from "astro";
import { getBrother } from "@/services/brothers";
import { db } from "@/lib/db";
import { autoInviteBrotherToActiveConvivencia } from "@/services/convivencias";

// GET - Obtener todos los hermanos (paginado)
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const data = await getBrother({ limit, offset });
    return new Response(JSON.stringify({
      success: true,
      data
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error en GET /api/brothers:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error al obtener los hermanos'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

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
      husband_phone,
      wife_phone,
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

    // 2. Validar nombres según estado civil
    if (civil_status === 'matrimonio') {
      if (!husband_name || !wife_name) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Para matrimonios se requieren ambos nombres'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
    } else {
      if (!full_name) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Se requiere el nombre completo'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // 3. Verificar/crear la comunidad del hermano
    let [communities]: any = await db.query(
      'SELECT id, level_paso FROM communities WHERE parish_id = ? AND number_community = ?',
      [parish_id, community_number]
    );

    let community_id;
    if (communities.length === 0) {
      // La comunidad no existe, crearla
      // Si no se proporcionó level_paso, usar un valor por defecto
      const paso = level_paso || 'Sin especificar';

      const [result]: any = await db.query(
        'INSERT INTO communities (parish_id, number_community, level_paso) VALUES (?, ?, ?)',
        [parish_id, community_number, paso]
      );
      community_id = result.insertId;
    } else {
      community_id = communities[0].id;

      // Si la comunidad existe pero no tiene paso definido y se proporcionó uno, actualizarlo
      const currentPaso = communities[0].level_paso;
      const needsUpdate = (!currentPaso || currentPaso.trim() === '' || currentPaso === 'Sin especificar');

      if (needsUpdate && level_paso && level_paso.trim() !== '') {
        await db.query(
          'UPDATE communities SET level_paso = ? WHERE id = ?',
          [level_paso, community_id]
        );
      }
    }

    // 4. Verificar que no exista duplicado en la misma comunidad
    if (civil_status === 'matrimonio') {
      const [existing]: any = await db.query(
        'SELECT id, names FROM brothers WHERE community_id = ? AND names IN (?, ?)',
        [community_id, husband_name, wife_name]
      );

      if (existing.length > 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Alguno de los cónyuges ya está registrado en esta comunidad'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
    } else {
      const [existing]: any = await db.query(
        'SELECT id FROM brothers WHERE names = ? AND community_id = ?',
        [full_name, community_id]
      );

      if (existing.length > 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Este hermano ya está registrado en esta comunidad'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
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

    // 6. Insertar hermanos según estado civil
    let responsePayload: any = null;

    if (civil_status === 'matrimonio') {
      // Insertar esposo
      const [husbandResult]: any = await db.query(
        'INSERT INTO brothers (names, civil_status, community_id, phone) VALUES (?, ?, ?, ?)',
        [husband_name, civil_status, community_id, husband_phone || phone || null]
      );

      const husband_id = husbandResult.insertId as number;

      // Insertar esposa
      const [wifeResult]: any = await db.query(
        'INSERT INTO brothers (names, civil_status, community_id, phone) VALUES (?, ?, ?, ?)',
        [wife_name, civil_status, community_id, wife_phone || phone || null]
      );

      const wife_id = wifeResult.insertId as number;

      // Enlazar cónyuges mediante spouse_id (en ambos sentidos)
      await db.query('UPDATE brothers SET spouse_id = ? WHERE id = ?', [wife_id, husband_id]);
      await db.query('UPDATE brothers SET spouse_id = ? WHERE id = ?', [husband_id, wife_id]);

      // Insertar roles en su propia comunidad para ambos (si aplica)
      if (roles_in_own_community && Array.isArray(roles_in_own_community)) {
        for (const role of roles_in_own_community) {
          await db.query(
            'INSERT INTO brother_roles (brother_id, community_id, role) VALUES (?, ?, ?)',
            [husband_id, community_id, role]
          );
          await db.query(
            'INSERT INTO brother_roles (brother_id, community_id, role) VALUES (?, ?, ?)',
            [wife_id, community_id, role]
          );
        }
      }

      // Si es catequista, insertar roles en otras comunidades para ambos
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

          // Insertar rol de catequista para ambos
          await db.query(
            'INSERT INTO brother_roles (brother_id, community_id, role) VALUES (?, ?, "catequista")',
            [husband_id, serves_community_id]
          );
          await db.query(
            'INSERT INTO brother_roles (brother_id, community_id, role) VALUES (?, ?, "catequista")',
            [wife_id, serves_community_id]
          );
        }
      }

      // Auto-invitar a la convivencia activa (si existe y la comunidad participa) para ambos
      try {
        await autoInviteBrotherToActiveConvivencia(husband_id, community_id);
        await autoInviteBrotherToActiveConvivencia(wife_id, community_id);
      } catch (e) {
        console.error(
          "Error al auto-invitar hermanos a convivencia activa (no bloqueante):",
          e,
        );
      }

      // Obtener ambos hermanos
      const [newBrothers]: any = await db.query(
        'SELECT * FROM brothers WHERE id IN (?, ?)',
        [husband_id, wife_id]
      );

      responsePayload = {
        success: true,
        data: {
          husband: newBrothers.find((b: any) => b.id === husband_id),
          wife: newBrothers.find((b: any) => b.id === wife_id),
        },
        message: 'Matrimonio registrado exitosamente',
      };
    } else {
      // Caso soltero/soltera: comportamiento original (un solo registro)
      const [brotherResult]: any = await db.query(
        'INSERT INTO brothers (names, civil_status, community_id, phone) VALUES (?, ?, ?, ?)',
        [full_name, civil_status, community_id, phone || null]
      );

      const brother_id = brotherResult.insertId;

      // Insertar roles en su propia comunidad
      if (roles_in_own_community && Array.isArray(roles_in_own_community)) {
        for (const role of roles_in_own_community) {
          await db.query(
            'INSERT INTO brother_roles (brother_id, community_id, role) VALUES (?, ?, ?)',
            [brother_id, community_id, role]
          );
        }
      }

      // Si es catequista, insertar roles en otras comunidades
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

      // Auto-invitar a la convivencia activa (si existe y la comunidad participa)
      try {
        await autoInviteBrotherToActiveConvivencia(brother_id, community_id);
      } catch (e) {
        console.error(
          "Error al auto-invitar hermano a convivencia activa (no bloqueante):",
          e,
        );
      }

      // Obtener el hermano completo con sus datos
      const [newBrother]: any = await db.query(
        'SELECT * FROM brothers WHERE id = ?',
        [brother_id]
      );

      responsePayload = {
        success: true,
        data: newBrother[0],
        message: 'Hermano registrado exitosamente',
      };
    }

    return new Response(JSON.stringify(responsePayload), {
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
