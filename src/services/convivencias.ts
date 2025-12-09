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
      ON c.id = ca.convivencia_id AND ca.will_attend = TRUE
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
