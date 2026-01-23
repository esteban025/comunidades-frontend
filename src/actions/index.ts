import { deleteCommunityAct, getCommunitiesAct, putCommunityAct } from "./communities";
import { brothersAction, getBrothersByCommunity } from "./brothers";
import { getParishesAct, deleteParishAct, putParishAct } from "./parishes";

export const server = {
  getParishesAct,
  deleteParishAct,
  putParishAct,
  getCommunitiesAct,
  putCommunityAct,
  deleteCommunityAct,
  getBrothersByCommunity,
  brothersAction,
}