import { db } from "@/lib/db";

interface Params {
  limit: number;
  offset: number;
}
export const getBrother = async (param: Params) => {
  const { limit, offset } = param;
  const query = `
    SELECT 
        b.id,
        b.names,
        b.civil_status,
        b.phone,
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
      GROUP BY b.id, b.names, b.civil_status, b.phone, b.community_id, 
               c.number_community, c.level_paso, p.id, p.name, p.tag, p.aka
      ORDER BY p.name, c.number_community, b.names
      LIMIT ? OFFSET ?
  `
  const [rows]: any = await db.query(query, [limit, offset]);

  // Procesar los roles para estructurarlos mejor
  const brothers = rows.map((row: any) => {
    const rolesInOwnCommunity: string[] = [];
    const catechistCommunities: number[] = [];

    if (row.roles) {
      const rolesList = row.roles.split('|');
      rolesList.forEach((roleInfo: string) => {
        const [role, communityId] = roleInfo.split(':');
        const commId = parseInt(communityId);

        if (commId === row.community_id) {
          // Rol en su propia comunidad
          rolesInOwnCommunity.push(role);
        } else if (role === 'catequista') {
          // Catequista de otra comunidad
          catechistCommunities.push(commId);
        }
      });
    }

    return {
      id: row.id,
      names: row.names,
      civil_status: row.civil_status,
      phone: row.phone,
      community: {
        id: row.community_id,
        number: row.number_community,
        level_paso: row.level_paso
      },
      parish: {
        id: row.parish_id,
        name: row.parish_name,
        tag: row.parish_tag,
        aka: row.parish_aka
      },
      roles_in_own_community: rolesInOwnCommunity,
      catechist_of_communities: catechistCommunities
    };
  });
  return brothers;
}