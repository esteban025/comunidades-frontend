import { useEffect, useState } from "react";
import { FilterList } from "./FilterList";
import { RefreshIcon } from "./iconsForReact";
import type { CommunityByIdParishWithoutParishId } from "@/types/community";
import { CardCommunityList } from "./CardCommunityList";
import { showNotification } from "@/scripts/notification";
import { actions } from "astro:actions";

export const ViewCommunities = ({ parishId }: { parishId: string }) => {
  const [communities, setCommunities] = useState<CommunityByIdParishWithoutParishId[]>([]);
  const [filters, setFilters] = useState({
    numberCommunity: "",
    nameResponsible: "",
    pairsOrImpares: ""
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Lógica para obtener y mostrar las comunidades
    const fetchCommunities = async () => {
      try {
        const { data, error } = await actions.getCommunitiesAct({ parishId: Number(parishId) });
        if (error || !data.success) {
          setError(data?.message || error?.message);
          setLoading(false);
          return;
        }
        const communitiesData = data.communities;
        setCommunities(communitiesData as CommunityByIdParishWithoutParishId[]);
        setLoading(false);

      } catch (error) {
        setError("Error al cargar las comunidades.");
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

  }, [parishId]);

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

  const detailsCommunity = (idComm: number) => {
    const community = filteredCommunities.find((comm) => comm.id === idComm);
    if (!community) return "Comunidad no encontrada";
    const { number_community, brothers_count } = community;
    return `N° ${number_community} - Hermanos: ${brothers_count}`;
  }

  const handleDeleteComm = async (id: number) => {
    const data = detailsCommunity(id)
    const confirmDelete = confirm(`Eliminar comunidad: ${data}, Se eliminara absolutamente toda su informacion relacionada. ¿Desea continuar?`);

    if (!confirmDelete) return

    try {
      const { data, error } = await actions.deleteCommunityAct({ id });
      if (error || !data.success) {
        showNotification(data?.message || error?.message || "Error al eliminar la comunidad.", "error");
        return
      }

      showNotification(data.message, "success");
      const updatedCommunities = communities.filter((comm) => comm.id !== id);
      setCommunities(updatedCommunities);

    } catch (error) {
      console.error("Error deleting community", error)
      window.alert("Hubo un error al eliminar la comunidad.")
    }
  }

  const handleEditComm = (e: React.MouseEvent<HTMLButtonElement>, comm: CommunityByIdParishWithoutParishId) => {
    e.preventDefault()
    const anyWindow = window as any
    if (typeof anyWindow.openEditModalComm === "function") {
      anyWindow.openEditModalComm(parishId, comm)
    } else {
      console.warn("openEditModalComm no está disponible en window")
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
      {error && (
        <p className="bg-red-50 border-red-300 text-red-700 p-6 rounded-lg text-center shadow-lg border-2 border-dotted">{error}</p>
      )}
      {!loading && !error && (

        <div className="flex flex-col gap-4">
          {
            filteredCommunities.length === 0 && (
              <p className="text-center text-description py-8 bg-white rounded-2xl shadow-md">No se encuentras comunidades registradas en esta parroquia actualmente</p>
            )
          }
          {
            filteredCommunities.map((comm) => (
              <CardCommunityList
                key={comm.id}
                filteredCommunities={[comm]}
                filters={filters}
                functionEditComm={(e) => handleEditComm(e, comm)}
                functionDeleteComm={() => handleDeleteComm(comm.id)}
              />
            ))
          }
        </div>
      )}
    </div>
  )
}