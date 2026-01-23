import { defineAction } from "astro:actions";
import { z } from "astro:schema";

export const brothersAction = defineAction({
  input: z.object({
    id: z.coerce.number().int().optional(),
    names: z.string().min(3).max(200),
    civil_status: z.string().min(3).max(50),
    community_id: z.number().int().min(1),
    phone: z.string().min(7).max(15).nullable(),
    spouse_id: z.number().int().nullable(),
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