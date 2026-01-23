import RolesIcon from "@/assets/RolesIcon.astro";
import { db } from "@/lib/db";
import type { Brothers, RolesBrothers } from "@/types/brothers";

interface Params {
  limit: number;
  offset: number;
}

const mapBrotherRows = (rows: any[]) => {
  return rows.map((row: any) => {
    const rolesInOwnCommunity: string[] = [];
    const catechistCommunities: number[] = [];

    if (row.roles) {
      const rolesList = row.roles.split('|');
      rolesList.forEach((roleInfo: string) => {
        const [role, communityId] = roleInfo.split(':');
        const commId = parseInt(communityId);

        if (commId === row.community_id) {
          rolesInOwnCommunity.push(role);
        } else if (role === 'catequista') {
          catechistCommunities.push(commId);
        }
      });
    }

    return {
      id: row.id,
      names: row.names,
      civil_status: row.civil_status,
      phone: row.phone,
      spouse_id: row.spouse_id,
      community: {
        id: row.community_id,
        number: row.number_community,
        level_paso: row.level_paso,
      },
      parish: {
        id: row.parish_id,
        name: row.parish_name,
        tag: row.parish_tag,
        aka: row.parish_aka,
      },
      roles_in_own_community: rolesInOwnCommunity,
      catechist_of_communities: catechistCommunities,
    };
  });
};

export const getBrother = async (param: Params) => {
  const { limit, offset } = param;
  const query = `
    SELECT 
        b.id,
        b.names,
        b.civil_status,
        b.phone,
        b.spouse_id,
        b.community_id,
        c.number_community,
        c.level_paso,
        p.id as parish_id,
        p.name as parish_name,
        p.tag as parish_tag,
        p.aka as parish_aka,
        GROUP_CONCAT(DISTINCT CONCAT(br.role, ':', br.community_id) SEPARATOR '|') as roles
      FROM brothers b
      INNER JOIN communities c ON b.community_id = c.id
      INNER JOIN parishes p ON c.parish_id = p.id
      LEFT JOIN brother_roles br ON b.id = br.brother_id
      GROUP BY b.id, b.names, b.civil_status, b.phone, b.spouse_id, b.community_id, 
               c.number_community, c.level_paso, p.id, p.name, p.tag, p.aka
      ORDER BY p.name, c.number_community, b.names
      LIMIT ? OFFSET ?
  `;
  const [rows]: any = await db.query(query, [limit, offset]);
  return mapBrotherRows(rows as any[]);
};

export const countBrotherGroups = async () => {
  const [countResult]: any = await db.query(
    `
      SELECT COUNT(DISTINCT CASE
        WHEN b.spouse_id IS NULL THEN b.id
        ELSE LEAST(b.id, b.spouse_id)
      END) as total
      FROM brothers b
    `,
  );
  return (countResult as any[])[0]?.total ?? 0;
};

export const getBrotherGroupKeysPage = async (param: Params) => {
  const { limit, offset } = param;
  const [groupKeyRows]: any = await db.query(
    `
      SELECT t.group_key
      FROM (
        SELECT
          CASE
            WHEN b.spouse_id IS NULL THEN b.id
            ELSE LEAST(b.id, b.spouse_id)
          END AS group_key,
          p.name AS parish_name,
          c.number_community AS number_community,
          MIN(b.names) AS sort_name
        FROM brothers b
        INNER JOIN communities c ON b.community_id = c.id
        INNER JOIN parishes p ON c.parish_id = p.id
        GROUP BY group_key, parish_name, number_community
      ) t
      ORDER BY t.parish_name, t.number_community, t.sort_name
      LIMIT ? OFFSET ?
    `,
    [limit, offset],
  );
  return (groupKeyRows as any[]).map((r) => r.group_key);
};

export const getBrothersByGroupKeys = async (groupKeys: Array<number>) => {
  if (!groupKeys || groupKeys.length === 0) return [];
  const placeholders = groupKeys.map(() => "?").join(",");
  const [rows]: any = await db.query(
    `
      SELECT 
          b.id,
          b.names,
          b.civil_status,
          b.phone,
          b.spouse_id,
          b.community_id,
          c.number_community,
          c.level_paso,
          p.id as parish_id,
          p.name as parish_name,
          p.tag as parish_tag,
          p.aka as parish_aka,
          GROUP_CONCAT(DISTINCT CONCAT(br.role, ':', br.community_id) SEPARATOR '|') as roles
        FROM brothers b
        INNER JOIN communities c ON b.community_id = c.id
        INNER JOIN parishes p ON c.parish_id = p.id
        LEFT JOIN brother_roles br ON b.id = br.brother_id
        WHERE (CASE
          WHEN b.spouse_id IS NULL THEN b.id
          ELSE LEAST(b.id, b.spouse_id)
        END) IN (${placeholders})
        GROUP BY b.id, b.names, b.civil_status, b.phone, b.spouse_id, b.community_id, 
                 c.number_community, c.level_paso, p.id, p.name, p.tag, p.aka
        ORDER BY p.name, c.number_community, b.names
    `,
    groupKeys,
  );

  return mapBrotherRows(rows as any[]);
};

export const getPersonalBrother = async (id: string) => {
  const query = `
    SELECT 
      b.id, b.names, b.civil_status, b.phone, b.community_id,
      s.names as spouse_name,
      c.number_community, c.level_paso,
      p.id as parish_id, p.name as parish_name,
      p.tag as parish_tag, p.aka as parish_aka
    FROM brothers b
    LEFT JOIN brothers s ON b.spouse_id = s.id
    LEFT JOIN communities c ON b.community_id = c.id
    LEFT JOIN parishes p ON c.parish_id = p.id
    WHERE b.id = ?
  `
  const [rows] = await db.query(query, [id])
  const data: any = rows as any[]
  return data

  // podemos hacer la siguiente query de obtencion de info
}

// === Nuevas Funcionalidades ===

interface BrothersByCommunityResponse {
  success: boolean;
  message: string;
  data?: RolesBrothers[] | RolesBrothers;
}
export const createBrother = async (data: Omit<Brothers, "id">): Promise<BrothersByCommunityResponse> => {
  const { names, civil_status, phone, spouse_id, community_id } = data
  const query = `
    INSERT INTO brothers (names, civil_status, phone, spouse_id, community_id)
    VALUES (?, ?, ?, ?, ?)
  `
  const [result]: any = await db.query(query, [
    names,
    civil_status,
    phone,
    spouse_id,
    community_id,
  ])
  return {
    success: true,
    message: "Hermano creado exitosamente",
  }
}

export const getBrothersByCommunityId = async (id: number): Promise<BrothersByCommunityResponse> => {
  const query = `
    SELECT
      b.id,
      b.names,
      b.civil_status,
      b.community_id,
      b.phone,
      b.spouse_id,
      COALESCE(GROUP_CONCAT(DISTINCT br.role ORDER BY br.role SEPARATOR ','), '') AS roles
    FROM brothers b
    LEFT JOIN brother_roles br
      ON br.brother_id = b.id AND br.community_id = b.community_id
    WHERE b.community_id = ?
    GROUP BY
      b.id,
      b.names,
      b.civil_status,
      b.community_id,
      b.phone,
      b.spouse_id
  `
  const [rows] = await db.query(query, [id])
  const data = rows as RolesBrothers[]

  return {
    success: true,
    message: "Hermanos obtenidos exitosamente",
    data
  }
}
