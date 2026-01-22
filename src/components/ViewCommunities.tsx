import { useEffect, useState } from "react";
import { FilterList } from "./FilterList";
import { RefreshIcon } from "./iconsForReact";
import type { CommunityByIdParish } from "@/types/community";
import { CardCommunityList } from "./CardCommunityList";
import { showNotification } from "@/scripts/notification";


export const ViewCommunities = ({ id }: { id: string }) => {
  const [communities, setCommunities] = useState<CommunityByIdParish[]>([]);
  const [filters, setFilters] = useState({
    numberCommunity: "",
    nameResponsible: "",
    pairsOrImpares: ""
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Lógica para obtener y mostrar las comunidades
    const fetchCommunities = async () => {
      try {
        const response = await fetch(`/api/communities-by-parish/${id}`);
        if (!response.ok) {
          setError("Hubo un fallo al obtener las comunidades.");
          setLoading(false);
          return;
        }
        const data = await response.json();
        if (!data.success) {
          setError("Hubo un fallo al obtener las comunidades.");
          setLoading(false);
          return;
        }
        setCommunities(data.data as CommunityByIdParish[]);
        if (!data.data || data.data.length === 0) {
          setError("No hay comunidades registradas aún.");
        } else {
          setError(null);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching communities", error);
        setError("Hubo un error al obtener las comunidades.");
        setLoading(false);
      }
    };

    fetchCommunities();

    const handleCommunityCreated = () => {
      fetchCommunities();
    }
    window.addEventListener("community:created", handleCommunityCreated);

    return () => {
      window.removeEventListener("community:created", handleCommunityCreated);
    };

  }, [id]);

  const filteredCommunities = communities.filter((community) => {
    const { numberCommunity, nameResponsible, pairsOrImpares } = filters;

    const matchesNumber = numberCommunity
      ? String(community.number_community).includes(numberCommunity.trim())
      : true;

    const matchesName = nameResponsible
      ? (community.responsables || "")
        .toLowerCase()
        .includes(nameResponsible.trim().toLowerCase())
      : true;

    const matchesParity = pairsOrImpares
      ? pairsOrImpares === "pairs"
        ? community.number_community % 2 === 0
        : community.number_community % 2 !== 0
      : true;

    return matchesNumber && matchesName && matchesParity;
  });

  const detailsCommunity = (id: number) => {
    const community = filteredCommunities.find((comm) => comm.id === id);
    if (!community) return "Comunidad no encontrada";
    const { number_community, brothers_count } = community;
    return `N° ${number_community} - Hermanos: ${brothers_count}`;
  }

  const handleDelete = async (id: number) => {
    const data = detailsCommunity(id)
    const confirmDelete = confirm(`Eliminar comunidad: ${data}, Se eliminara absolutamente toda su informacion relacionada. ¿Desea continuar?`);

    if (!confirmDelete) return

    try {
      const res = await fetch(`/api/communities/${id}`, {
        method: "DELETE",
      });
      const result = await res.json()
      if (!res.ok || !result.success) {
        window.alert(result.error ?? "Hubo un error al eliminar la comunidad")
        return
      }
      setCommunities((prev) => prev.filter((p) => p.id !== id))
      showNotification(
        "Comunidad eliminada exitosamente.",
        "success"
      )
    } catch (error) {
      const msg = `error: ${error}`;
      window.alert(msg);
    }


  }
  return (
    <div className="flex flex-col gap-6">
      <FilterList filters={filters} onChange={setFilters} />
      {loading && (
        <p className="py-4 text-center">
          <span>Cargando comunidades</span>
          <RefreshIcon className="inline-block size-5 ml-2 animate-spin" />
        </p>
      )}
      {error && <p className="bg-red-50/50 text-red-500 p-3 py-6 w-full rounded-xl border text-center border-dashed">{error}</p>}
      {!loading && !error && (

        <div className="flex flex-col gap-4">
          {
            filteredCommunities.map((comm) => (
              <CardCommunityList
                key={comm.id}
                filteredCommunities={[comm]}
                filters={filters}
                handleDelete={() => handleDelete(comm.id)}
              />
            ))
          }
        </div>
      )}
    </div>
  )
}