import { createParish, updateParish } from "@/services/parishes";
import { defineAction } from "astro:actions";
import { z } from "astro:schema";

export const parishesAction = defineAction({
  input: z.object({
    id: z.coerce.number().int().optional(),
    name: z.string().min(3).max(100),
    tag: z.string().min(3).max(10),
    aka: z.string().min(3).max(100),
  }),
  async handler(input) {
    if (input.id) {
      await updateParish(input.id, {
        name: input.name,
        tag: input.tag,
        aka: input.aka,
      })
      return {
        success: true,
        message: "Parroquia actualizada exitosamente"
      }
    }

    await createParish({
      name: input.name,
      tag: input.tag,
      aka: input.aka,
    })
    return {
      success: true,
      message: "Parroquia creada exitosamente"
    }
  }
})