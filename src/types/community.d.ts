export interface Community {
  id: number;
  number_community: number;
  level_paso: string | null;
  parish_id: number;
}
export interface CommunityByIdParish extends Community {
  brothers_count: number
  responsables: string | null;
}

// omitimos parish_id a CommunityByIdParish
export type CommunityByIdParishWithoutParishId = Omit<CommunityByIdParish, "parish_id">;


export interface ResponsablesByCommunity {
  community_id: number;
  responsable_name: string;
}

export interface CommunityById extends Community {
  parish_name: string;
  parish_aka: string;
  total_brothers: number;
}
