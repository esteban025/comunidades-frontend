import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import { getBrothersByCommunityId } from "@/services/brothers";

// obtener hermanos por id de comunidad
export const getBrothersByCommunity = defineAction({
  input: z.object({
    community_id: z.coerce.number().int(),
  }),
  async handler(input) {
    const brothers = await getBrothersByCommunityId(input.community_id);
    return {
      success: brothers.success,
      message: brothers.message,
      data: brothers.data,
    };
  }
})

export const brothersAction = defineAction({
  input: z.object({
    id: z.coerce.number().int().optional(),
    names: z.string().min(3).max(200),
    civil_status: z.string().min(3).max(50),
    community_id: z.coerce.number().int(),
    phone: z.string().min(7).max(15).nullable(),
    spouse_id: z.coerce.number().int().nullable(),
  }),
  async handler(input) {
    // si hay id actualizamos si no creamos
    if (input.id) {
      // lógica de actualización aquí
    } else {
      // lógica de creación aquí
    }

    return {
      success: true,
      message: "Acción de hermanos ejecutada exitosamente"
    };
  }
})