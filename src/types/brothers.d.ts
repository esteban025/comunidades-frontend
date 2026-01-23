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


export interface BrothersResponse {
  success: boolean;
  data: Brother[];
  // error?: string;
  pagination: PaginationPage;
}


// === TIPOS ACTUALIZADOS ===
export interface Brothers {
  id: number;
  names: string;
  civil_status: 'matrimonio' | 'soltero' | 'soltera';
  phone: string | null;
  spouse_id: number | null;
  community_id: number;
}

export interface AllBrothers extends Brothers {
  roles: string | null;
}