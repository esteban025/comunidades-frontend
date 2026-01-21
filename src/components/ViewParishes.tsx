import type { Parish, ParishesResponse } from "@/types/parishes"
import { useEffect, useState } from "react"
import { EditIcon, TrashIcon } from "./iconsForReact"
import { showNotification } from "@/scripts/notification"

export const ViewParishes = () => {
  const [parishes, setParishes] = useState<Parish[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchParishes = async () => {
      try {
        const response = await fetch("/api/parishes")
        if (!response.ok) {
          setError("Hubo un fallo al obtener las parroquias.")
          setLoading(false)
          return
        }

        const data = (await response.json()) as ParishesResponse

        if (!data.success) {
          setError("Hubo un fallo al obtener las parroquias.")
          setLoading(false)
          return
        }

        setParishes(data.data)
        if (data.data.length === 0) {
          setError("No hay parroquias registradas aún.")
        }
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
      const response = await fetch(`/api/parishes/${id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        window.alert(result.error ?? "Hubo un error al eliminar la parroquia.")
        return
      }

      setParishes((prev) => prev.filter((p) => p.id !== id))
      showNotification(
        "Parroquia eliminada exitosamente.",
        "success"
      )
    } catch (error) {
      console.error("Error deleting parish", error)
      window.alert("Hubo un error al eliminar la parroquia.")
    }
  }

  return (
    <div
      id="parishes-grid"
      className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]"
    >
      {loading && <p>Loading parishes...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && parishes.length === 0 && (<p>No parishes found.</p>)}
      {!loading &&
        !error &&
        parishes.map((parish) => (
          <div className="card relative group" key={parish.id}>
            <div className="group-hover:scale-95 transition-transform duration-300 ease-in-out">
              <a href={`/parishes/${parish.id}`} className="p-4 rounded-xl border border-gray-300 shadow-sm hover:shadow-lg transition-shadow duration-200 ease-in-out block">
                <h2 className="text-xl font-semibold">{parish.name}</h2>
                <p className="text-description text-sm ">{parish.aka}</p>
                <span className="rounded-full px-2 py-1 border-2 border-neutral-400 text-neutral-400 mt-4 block w-min">{parish.tag}</span>
              </a>
            </div>
            <div className="absolute top-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out flex flex-col gap-2">
              <button
                className="edit-parish-btn atn-btn"
                title="Editar Parroquia"
                onClick={(e) => handleEditParish(e, parish)}
              >
                <EditIcon className="size-5" />
              </button>
              <button
                className="atn-btn"
                title="Eliminar Parroquia"
                onClick={() => handleDeleteParish(parish.id)}
              >
                <TrashIcon className="size-5 text-red-400 hover:text-red-600" />
              </button>
            </div>
          </div>
        ))}
    </div>
  )
}