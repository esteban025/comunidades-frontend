import type { Parish } from "./parishes";

export interface PaginationPage {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  from: number;
  to: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface BrotherCommunity {
  id: number;
  number: number;
  level_paso?: string;
}

export interface Brothers {
  id: number;
  names: string;
  civil_status: string;
  spouse_id?: number | null;
  phone?: string;
  community: BrotherCommunity;
  parish: Parish;
  roles_in_own_community: string[];
  catechist_of_communities: number[];
}
export interface BrothersResponse {
  success: boolean;
  data: Brother[];
  // error?: string;
  pagination: PaginationPage;
}