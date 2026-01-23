import { createParish, updateParish, getParishes, deleteParish } from "@/services/parishes";
import { defineAction } from "astro:actions";
import { z } from "astro:schema";

export const getParishesAct = defineAction({
  async handler() {
    const res = await getParishes()
    return {
      success: res.success,
      message: res.message,
      parishes: res.parish
    }
  }
})

export const putParishAct = defineAction({
  input: z.object({
    id: z.coerce.number().int().optional(),
    name: z.string().min(3).max(100),
    tag: z.string().min(3).max(10),
    aka: z.string().min(3).max(100),
  }),
  async handler(input) {
    if (input.id) {
      const res = await updateParish(input.id, {
        name: input.name,
        tag: input.tag,
        aka: input.aka,
      })
      return {
        success: res.success,
        message: res.message
      }
    }

    const res = await createParish({
      name: input.name,
      tag: input.tag,
      aka: input.aka,
    })
    return {
      success: res.success,
      message: res.message
    }
  }
})

export const deleteParishAct = defineAction({
  input: z.object({
    id: z.coerce.number().int(),
  }),
  async handler({ id }) {
    const res = await deleteParish(id)
    return {
      success: res.success,
      message: res.message
    }
  }
})