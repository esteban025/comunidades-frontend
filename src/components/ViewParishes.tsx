import type { Parish } from "@/types/parishes"
import { RefreshIcon } from "./iconsForReact"
import { useEffect, useState } from "react"
import { showNotification } from "@/scripts/notification"
import { CardParishList } from "./CardParishList"
import { actions } from "astro:actions"

export const ViewParishes = () => {
  const [parishes, setParishes] = useState<Parish[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    const fetchParishes = async () => {
      try {
        const response = await actions.getParishesAct({})

        if (!response.data?.success) {
          setError(response.data?.message)
          setLoading(false)
          return
        }
        const data = response.data.parishes
        setParishes(data as Parish[])
        setLoading(false)

      } catch (error) {
        console.error("Error fetching parishes", error)
        setError("Hubo un error al obtener las parroquias.")
        setLoading(false)
      }
    }

    fetchParishes()

    const handleParishCreated = () => {
      fetchParishes()
    }

    window.addEventListener("parish:created", handleParishCreated)

    return () => {
      window.removeEventListener("parish:created", handleParishCreated)
    }
  }, [])

  const handleEditParish = (e: React.MouseEvent<HTMLButtonElement>, parish: Parish) => {
    e.preventDefault()
    const anyWindow = window as any
    if (typeof anyWindow.openEditParishModal === "function") {
      anyWindow.openEditParishModal(parish)
    } else {
      console.warn("openEditParishModal no está disponible en window")
    }
  }
  const handleDeleteParish = async (id: number) => {
    const confirmDelete = window.confirm(
      "Esta parroquia se eliminará junto con todas sus comunidades internas que existan. ¿Deseas continuar?"
    )

    if (!confirmDelete) return

    try {
      const res = await actions.deleteParishAct({ id })

      if (res.data?.success) {
        showNotification(res.data.message, "success")
        // Refrescar la lista de parroquias
        const updatedParishes = parishes.filter((parish) => parish.id !== id)
        setParishes(updatedParishes)
      } else {
        showNotification(
          res.data?.message || "Hubo un error al eliminar la parroquia.",
          "error"
        )
      }
    } catch (error) {
      console.error("Error deleting parish", error)
      window.alert("Hubo un error al eliminar la parroquia.")
    }
  }

  return (
    <>
      {loading && (
        <p className="py-4 text-center w-full">
          <span>Cargando parroquias</span>
          <RefreshIcon className="inline-block size-5 ml-2 animate-spin" />
        </p>
      )}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && parishes.length === 0 && (<p>No parishes found.</p>)}
      {!loading && !error && (
        <div
          id="parishes-grid"
          className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]"
        >
          {parishes.map((parish, index) => (
            <CardParishList
              key={parish.id}
              parish={parish}
              index={index}
              functionEdit={(e) => handleEditParish(e, parish)}
              functionDelete={() => handleDeleteParish(parish.id)}
            />
          ))}
        </div>
      )}
    </>
  )
}