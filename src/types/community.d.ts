export interface CommunityByIdParish {
  id: number,
  number_community: number,
  level_paso: string | null,
  brothers_count: number
}

export interface ResponsablesByCommunity {
  community_id: number;
  responsable_name: string;
}

export interface CommunityById {
  id: number,
  number_community: number;
  level_paso: string;
  parish_name: string;
  parish_aka: string;
  total_brothers: number;
}
