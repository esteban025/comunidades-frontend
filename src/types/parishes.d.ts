// {
//   "id": 1,
//   "name": "San Luis de Gongaza",
//   "tag": "SLG",
//   "aka": "Quinta Chica"
// },
export interface ParishesResponse {
  success: boolean;
  data: Parish[];
  // error?: string;
}
export interface Parish {
  id: number;
  name: string;
  tag: string;
  aka: string;
}