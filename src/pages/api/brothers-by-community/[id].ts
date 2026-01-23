import { db } from "@/lib/db";
import type { AllBrothers } from "@/types/brothers";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;
  try {
    // 1.comprobamos que exista la comunidad
    const communityCheckQuery = 'SELECT id FROM communities WHERE id = ?';
    const [communityCheckResults]: any[] = await db.query(communityCheckQuery, [id]);

    if (communityCheckResults.length === 0) {
      return new Response(JSON.stringify({ error: 'Community not found' }), { status: 404 });
    }

    // 2. obtenemos los hermanos que pertenecen a esa comunidad junto con sus roles
    const query = `
      SELECT 
        b.id,
        b.names,
        b.civil_status,
        b.phone,
        b.spouse_id,
        b.community_id,
        GROUP_CONCAT(br.role SEPARATOR ', ') as roles
      FROM brothers b
      LEFT JOIN brother_roles br ON b.id = br.brother_id AND br.community_id = b.community_id
      WHERE b.community_id = ?
      GROUP BY b.id, b.names, b.civil_status, b.phone, b.spouse_id, b.community_id
      ORDER BY b.id;
    `
    const [results] = await db.query(query, [id]);
    const data = results as AllBrothers[];
    console.log(data)

    if (data.length === 0) {
      return new Response(JSON.stringify({ error: 'No leaders found for this community' }), { status: 200 });
    }

    return new Response(JSON.stringify({ success: true, data }), { status: 200 });

  } catch (error) {
    console.error("Error fetching leaders for community ID:", id, error);
    return new Response(JSON.stringify({ error: 'Error retrieving leaders' }), { status: 500 });
  }
}

export const POST: APIRoute = async ({ request, params }) => {

}