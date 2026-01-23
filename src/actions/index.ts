import { communitiesAction } from "./communities";
import { brothersAction } from "./brothers";
import { getParishesAct, deleteParishAct, putParishAct } from "./parishes";

export const server = {
  getParishesAct,
  deleteParishAct,
  putParishAct,
  communitiesAction,
  brothersAction,
}