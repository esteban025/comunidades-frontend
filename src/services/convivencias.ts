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
      br.spouse_id,
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
    spouse_id: row.spouse_id,
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
      br.spouse_id,
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

export async function getConvivenciaDetails(convivenciaId: number) {
  const [convRows]: any = await db.query(
    "SELECT id, name, description, start_date, end_date, status FROM convivencias WHERE id = ?",
    [convivenciaId],
  );

  if (!convRows || convRows.length === 0) return null;

  const conv = convRows[0];

  const communitiesQuery = `
    SELECT
      c.id,
      c.number_community,
      c.level_paso,
      p.id AS parish_id,
      p.name AS parish_name,
      p.aka AS parish_aka,
      (
        SELECT
          CASE
            WHEN br.civil_status = 'matrimonio'
              AND br.spouse_id IS NOT NULL
              AND s.id IS NOT NULL THEN
              CONCAT(
                CASE WHEN br.id < s.id THEN br.names ELSE s.names END,
                ' y ',
                CASE WHEN br.id < s.id THEN s.names ELSE br.names END
              )
            ELSE br.names
          END
        FROM brothers br
        INNER JOIN brother_roles brol ON br.id = brol.brother_id
        LEFT JOIN brothers s ON br.spouse_id = s.id
        WHERE brol.community_id = c.id AND brol.role = 'responsable'
        ORDER BY br.id ASC
        LIMIT 1
      ) AS responsible_name,
      COUNT(b.id) AS total_brothers
    FROM convivencia_communities cc
    INNER JOIN communities c ON cc.community_id = c.id
    INNER JOIN parishes p ON c.parish_id = p.id
    LEFT JOIN brothers b ON c.id = b.community_id
    WHERE cc.convivencia_id = ?
    GROUP BY
      c.id,
      c.number_community,
      c.level_paso,
      p.id,
      p.name,
      p.aka
    ORDER BY p.name, c.number_community ASC
  `;

  const [communityRows]: any = await db.query(communitiesQuery, [convivenciaId]);

  return {
    ...conv,
    community_ids: (communityRows || []).map((c: any) => Number(c.id)),
    communities: communityRows || [],
  };
}

interface UpdateConvivenciaParams {
  name: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  community_ids: number[];
}

export async function updateConvivencia(
  convivenciaId: number,
  params: UpdateConvivenciaParams,
) {
  const { name, description, start_date, end_date, community_ids } = params;

  if (!name || !start_date || !end_date || !Array.isArray(community_ids)) {
    throw new Error("Faltan campos requeridos para actualizar la convivencia");
  }

  const normalizedCommunityIds = Array.from(
    new Set(
      community_ids
        .map((id) => Number(id))
        .filter((id) => !Number.isNaN(id)),
    ),
  );

  await db.query("START TRANSACTION");

  try {
    await db.query(
      "UPDATE convivencias SET name = ?, description = ?, start_date = ?, end_date = ? WHERE id = ?",
      [name, description || null, start_date, end_date, convivenciaId],
    );

    const [existingRows]: any = await db.query(
      "SELECT community_id FROM convivencia_communities WHERE convivencia_id = ?",
      [convivenciaId],
    );

    const existingIds = new Set<number>(
      (existingRows || []).map((r: any) => Number(r.community_id)),
    );

    const nextIds = new Set<number>(normalizedCommunityIds);

    const toRemove = Array.from(existingIds).filter((id) => !nextIds.has(id));
    const toAdd = Array.from(nextIds).filter((id) => !existingIds.has(id));

    if (toRemove.length > 0) {
      const placeholders = toRemove.map(() => "?").join(", ");
      await db.query(
        `DELETE FROM convivencia_communities
         WHERE convivencia_id = ? AND community_id IN (${placeholders})`,
        [convivenciaId, ...toRemove],
      );

      // Quitar de invitados los hermanos de comunidades removidas (sin tocar confirmados)
      const invitedDeleteQuery = `
        DELETE ci
        FROM convivencia_invited ci
        INNER JOIN brothers br ON ci.brother_id = br.id
        WHERE ci.convivencia_id = ?
          AND br.community_id IN (${placeholders})
      `;
      await db.query(invitedDeleteQuery, [convivenciaId, ...toRemove]);
    }

    if (toAdd.length > 0) {
      const values = toAdd.map(() => "(?, ?)").join(", ");
      const paramsArray: any[] = [];
      toAdd.forEach((id) => paramsArray.push(convivenciaId, id));

      await db.query(
        `INSERT IGNORE INTO convivencia_communities (convivencia_id, community_id) VALUES ${values}`,
        paramsArray,
      );

      const placeholders = toAdd.map(() => "?").join(", ");
      const invitedInsertQuery = `
        INSERT IGNORE INTO convivencia_invited (convivencia_id, brother_id)
        SELECT ?, br.id
        FROM brothers br
        WHERE br.community_id IN (${placeholders})
      `;
      await db.query(invitedInsertQuery, [convivenciaId, ...toAdd]);
    }

    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
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
      br.civil_status,
      br.spouse_id,
      c.id AS community_id,
      c.number_community AS community_number,
      p.name AS parish_name,
      p.aka AS parish_aka,
      cc.community_id AS conv_community_id,
      ca.observations,
      ca.special_needs,
      ca.attended,
      casas.name AS casa_name
    FROM convivencia_attendees ca
    INNER JOIN brothers br ON ca.brother_id = br.id
    INNER JOIN communities c ON br.community_id = c.id
    INNER JOIN parishes p ON c.parish_id = p.id
    LEFT JOIN convivencia_communities cc
      ON cc.convivencia_id = ca.convivencia_id
      AND cc.community_id = c.id
    LEFT JOIN casas_convivencia casas ON ca.casa_id = casas.id
    WHERE ca.convivencia_id = ?
    ORDER BY p.name, c.number_community, br.names
  `;

  const [rows]: any = await db.query(query, [convivenciaId]);

  return rows;
}
