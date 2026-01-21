import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import { createCommunity, upadateCommunity } from "@/services/communities";

export const communitiesAction = defineAction({
  input: z.object({
    id: z.coerce.number().int().optional(),
    number_community: z.number().min(1).max(5),
    parish_id: z.number().int().min(1),
    level_paso: z.string().min(3).max(100),
  }),
  async handler(input) {
    // actualizar
    if (input.id) {
      await upadateCommunity(input.id, {
        number_community: input.number_community,
        parish_id: input.parish_id,
        level_paso: input.level_paso,
      })
      return {
        success: true,
        message: "Comunidad actualizada exitosamente"
      }
    }

    await createCommunity({
      number_community: input.number_community,
      parish_id: input.parish_id,
      level_paso: input.level_paso,
    })
    return {
      success: true,
      message: "Comunidad creada exitosamente"
    }
  }
})