import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import { createCommunity, updateCommunity, deleteCommunity } from "@/services/communities";
import { getCommunityByIdParish } from "@/services/communities";

export const getCommunitiesAct = defineAction({
  input: z.object({
    parishId: z.coerce.number().int(),
  }),
  async handler({ parishId }) {
    const communities = await getCommunityByIdParish(parishId)
    return {
      success: communities.success,
      message: communities.message,
      communities: communities.community
    }
  }
})

export const putCommunityAct = defineAction({
  input: z.object({
    id: z.coerce.number().int().optional(),
    number_community: z.number().min(1),
    parish_id: z.number().int().min(1),
    level_paso: z.string().min(3).max(200).nullable(),
  }),
  async handler(input) {
    if (input.id) {
      const res = await updateCommunity(input.id, {
        number_community: input.number_community,
        parish_id: input.parish_id,
        level_paso: input.level_paso,
      })
      return {
        success: res.success,
        message: res.message
      }
    }

    const res = await createCommunity({
      number_community: input.number_community,
      parish_id: input.parish_id,
      level_paso: input.level_paso,
    })
    return {
      success: res.success,
      message: res.message
    }
  }
})

export const deleteCommunityAct = defineAction({
  input: z.object({
    id: z.coerce.number().int(),
  }),
  async handler({ id }) {
    const res = await deleteCommunity(id)
    return {
      success: res.success,
      message: res.message
    }
  }
})