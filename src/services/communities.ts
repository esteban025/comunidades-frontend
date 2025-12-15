import { db } from "@/lib/db";
import type { CommunityById, CommunityByIdParish, ResponsablesByCommunity } from "@/types/community"
import type { Brothers } from "@/types/brothers";

export const getCommunityByIdParis = async (id: number) => {
  const query = `
    SELECT 
      c.id,
      c.number_community,
      c.level_paso,
      COUNT(DISTINCT b.id) as brothers_count
    FROM communities c
    LEFT JOIN brothers b ON c.id = b.community_id
    WHERE c.parish_id = ?
    GROUP BY c.id, c.number_community, c.level_paso
    ORDER BY c.number_community ASC
  `
  const [rows] = await db.query(query, [id])
  const data: CommunityByIdParish[] = rows as CommunityByIdParish[]
  return data
}

// internas de la comunidad

export const getResponsablesByCommunity = async (idsComunnities: number[]) => {
  const query = `
    SELECT DISTINCT
      br.community_id,
      CASE
        WHEN b.civil_status = 'matrimonio' AND b.spouse_id IS NOT NULL AND s.id IS NOT NULL THEN
          CONCAT(
            CASE WHEN b.id < s.id THEN b.names ELSE s.names END,
            ' y ',
            CASE WHEN b.id < s.id THEN s.names ELSE b.names END
          )
        ELSE b.names
      END as responsable_name
    FROM brother_roles br
    INNER JOIN brothers b ON br.brother_id = b.id
    LEFT JOIN brothers s ON b.spouse_id = s.id
    WHERE br.role = 'responsable'
      AND br.community_id IN (${idsComunnities.map(() => "?").join(",")})
  `
  const [rows] = await db.query(query, idsComunnities)
  const data: ResponsablesByCommunity[] = rows as ResponsablesByCommunity[]
  return data
}

export const getCommunityById = async (id: string) => {
  const query = `
    SELECT 
      c.id,
      c.number_community,
      c.level_paso,
      p.name as parish_name,
      p.aka as parish_aka,
      (SELECT COUNT(*) FROM brothers WHERE community_id = c.id) as total_brothers
    FROM communities c
    LEFT JOIN parishes p ON c.parish_id = p.id
    WHERE c.id = ?
  `
  const [rows] = await db.query(query, [id])
  const data: CommunityById[] = rows as CommunityById[]
  return data
}

// id, name, phone
export type BrotherContact = Pick<Brothers, "id" | "names" | "phone">;
export const getBrotherContact = async (communityId: string, rol: string = 'responsable') => {
  const query = `
    SELECT DISTINCT b.id, b.names, b.phone
      FROM brothers b
      INNER JOIN brother_roles br
        ON b.id = br.brother_id
      WHERE br.community_id = ? AND LOWER(br.role) = LOWER(?)
  `
  const [rows] = await db.query(query, [communityId, rol])
  const data: BrotherContact[] = rows as BrotherContact[]
  return data
}


export interface CommunityRolesGroup {
  responsables: BrotherContact[];
  corresponsables: BrotherContact[];
  catequistas: BrotherContact[];
  other_roles: BrotherContact[]
}

// resp, corres, catequistas, didascalas, ostiarios
export const getDataGroupResponsables = async (
  communityId: string,
): Promise<CommunityRolesGroup> => {

  const getOtherRoles = async (): Promise<{
    didascalas: BrotherContact[]
    ostiarios: BrotherContact[]
  }> => {
    const query = `
      SELECT DISTINCT b.id, b.names, b.phone, LOWER(br.role) AS role
      FROM brothers b
      INNER JOIN brother_roles br
        ON b.id = br.brother_id
      WHERE br.community_id = ? AND LOWER(br.role) IN ('didascala', 'ostiario')
    `
    const [rows] = await db.query(query, [communityId])
    const data = rows as Array<BrotherContact & { role: string }>

    return {
      didascalas: data.filter((r) => r.role === "didascala"),
      ostiarios: data.filter((r) => r.role === "ostiario"),
    }
  }

  const [responsables, corresponsables, catequistas, other] = await Promise.all([
    getBrotherContact(communityId, "responsable"),
    getBrotherContact(communityId, "corresponsable"),
    getBrotherContact(communityId, "catequista"),
    getOtherRoles(),
  ])

  return {
    responsables,
    corresponsables,
    catequistas,
    other_roles: [...other.didascalas, ...other.ostiarios],
    // didascalas: other.didascalas,
    // ostiarios: other.ostiarios,
  }
}

export const getCommByIdPlusResponsables = async (communityId: string) => {
  const query = ``
  const data = await db.query(query, [communityId])
}