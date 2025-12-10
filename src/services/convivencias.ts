import { db } from "@/lib/db";

export type ConvivenciaStatus = "planificada" | "en_curso" | "finalizada";

interface CreateConvivenciaParams {
  name: string;
  description?: string | null;
  start_date: string; // ISO date (YYYY-MM-DD)
  end_date: string;   // ISO date (YYYY-MM-DD)
  community_ids: number[];
}

export async function createConvivencia(params: CreateConvivenciaParams) {
  const { name, description, start_date, end_date, community_ids } = params;

  if (!name || !start_date || !end_date || !Array.isArray(community_ids)) {
    throw new Error("Faltan campos requeridos para crear la convivencia");
  }

  // Iniciar transacción
  await db.query("START TRANSACTION");

  try {
    // 1. Crear convivencia
    const insertConvQuery =
      "INSERT INTO convivencias (name, start_date, end_date, description) VALUES (?, ?, ?, ?)";
    const [convResult]: any = await db.query(insertConvQuery, [
      name,
      start_date,
      end_date,
      description || null,
    ]);

    const convivenciaId = convResult.insertId as number;

    // 2. Asociar comunidades invitadas
    if (community_ids.length > 0) {
      const values = community_ids.map(() => "(?, ?)").join(", ");
      const paramsArray: any[] = [];
      community_ids.forEach((id) => {
        paramsArray.push(convivenciaId, id);
      });

      const insertCommunitiesQuery =
        `INSERT INTO convivencia_communities (convivencia_id, community_id) VALUES ${values}`;
      await db.query(insertCommunitiesQuery, paramsArray);

      // 3. Poblar tabla de invitados con todos los hermanos de esas comunidades
      const placeholders = community_ids.map(() => "?").join(", ");
      const invitedQuery = `
        INSERT IGNORE INTO convivencia_invited (convivencia_id, brother_id)
        SELECT ?, br.id
        FROM communities c
        INNER JOIN brothers br ON br.community_id = c.id
        WHERE c.id IN (${placeholders})
      `;

      await db.query(invitedQuery, [convivenciaId, ...community_ids]);
    }

    // 3. Confirmar transacción
    await db.query("COMMIT");

    // 4. Devolver convivencia creada (básica)
    const [rows]: any = await db.query(
      "SELECT * FROM convivencias WHERE id = ?",
      [convivenciaId],
    );

    return rows[0];
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
}

export async function getConvivenciasForDashboard() {
  const query = `
    SELECT 
      c.id,
      c.name,
      c.start_date,
      c.end_date,
      c.status,
      c.description,
      COUNT(DISTINCT cc.community_id) AS total_communities,
      COUNT(DISTINCT ca.brother_id) AS total_attendees
    FROM convivencias c
    LEFT JOIN convivencia_communities cc ON c.id = cc.convivencia_id
    LEFT JOIN convivencia_attendees ca 
      ON c.id = ca.convivencia_id
    GROUP BY c.id, c.name, c.start_date, c.end_date, c.status, c.description
    ORDER BY c.start_date DESC, c.id DESC
  `;

  const [rows]: any = await db.query(query);

  const totals = {
    planificadas: 0,
    en_curso: 0,
    finalizadas: 0,
    totalAsistentes: 0,
  };

  rows.forEach((row: any) => {
    if (row.status === "planificada") totals.planificadas++;
    if (row.status === "en_curso") totals.en_curso++;
    if (row.status === "finalizada") totals.finalizadas++;
    totals.totalAsistentes += Number(row.total_attendees || 0);
  });

  return {
    convivencias: rows,
    totals,
  };
}

export async function getEligibleBrothersByConvivencia(convivenciaId: number) {
  const query = `
    SELECT 
      br.id AS brother_id,
      br.names,
      c.number_community AS community_number,
      p.name AS parish_name
    FROM convivencia_communities cc
    INNER JOIN communities c ON cc.community_id = c.id
    INNER JOIN brothers br ON br.community_id = c.id
    INNER JOIN parishes p ON c.parish_id = p.id
    WHERE cc.convivencia_id = ?
    ORDER BY p.name, c.number_community, br.names
  `;

  const [rows]: any = await db.query(query, [convivenciaId]);

  const total_eligible = rows.length;
  const total_attending = 0; // inicialmente nadie marcado como asistente

  const data = rows.map((row: any) => ({
    brother_id: row.brother_id,
    names: row.names,
    community_number: row.community_number,
    parish_name: row.parish_name,
    will_attend: false,
    casa_assigned: null,
    observations: null,
  }));

  return {
    data,
    total_eligible,
    total_attending,
  };
}

export async function getInvitedBrothersByConvivencia(convivenciaId: number) {
  const query = `
    SELECT
      br.id AS brother_id,
      br.names,
      c.number_community AS community_number,
      p.name AS parish_name,
      p.aka AS parish_aka
    FROM convivencia_invited ci
    INNER JOIN brothers br ON ci.brother_id = br.id
    INNER JOIN communities c ON br.community_id = c.id
    INNER JOIN parishes p ON c.parish_id = p.id
    WHERE ci.convivencia_id = ?
    ORDER BY p.name, c.number_community, br.names
  `;

  const [rows]: any = await db.query(query, [convivenciaId]);

  return rows;
}

// Auto-invitar a un hermano recién creado a la convivencia activa (planificada)
// siempre y cuando su comunidad forme parte de esa convivencia.
export async function autoInviteBrotherToActiveConvivencia(
  brotherId: number,
  communityId: number,
) {
  // Buscar la convivencia más reciente en estado planificada
  const findConvQuery = `
    SELECT c.id
    FROM convivencias c
    INNER JOIN convivencia_communities cc ON cc.convivencia_id = c.id
    WHERE c.status = 'planificada' AND cc.community_id = ?
    ORDER BY c.start_date DESC, c.id DESC
    LIMIT 1
  `;

  const [rows]: any = await db.query(findConvQuery, [communityId]);

  if (!rows || rows.length === 0) {
    return; // No hay convivencia activa para esta comunidad
  }

  const convivenciaId = rows[0].id as number;

  // Insertar como invitado si aún no existe
  const insertQuery = `
    INSERT IGNORE INTO convivencia_invited (convivencia_id, brother_id)
    VALUES (?, ?)
  `;

  await db.query(insertQuery, [convivenciaId, brotherId]);
}

export async function getConfirmedBrothersByConvivencia(convivenciaId: number) {
  const query = `
    SELECT
      br.id AS brother_id,
      br.names,
      c.number_community AS community_number,
      p.name AS parish_name,
      p.aka AS parish_aka,
      ca.observations,
      ca.special_needs,
      ca.attended,
      casas.name AS casa_name
    FROM convivencia_attendees ca
    INNER JOIN brothers br ON ca.brother_id = br.id
    INNER JOIN communities c ON br.community_id = c.id
    INNER JOIN parishes p ON c.parish_id = p.id
    LEFT JOIN casas_convivencia casas ON ca.casa_id = casas.id
    WHERE ca.convivencia_id = ?
    ORDER BY p.name, c.number_community, br.names
  `;

  const [rows]: any = await db.query(query, [convivenciaId]);

  return rows;
}
