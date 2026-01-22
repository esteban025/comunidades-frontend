import { useEffect, useState } from "react";
import { FilterList } from "./FilterList";
import { RefreshIcon } from "./iconsForReact";
import type { CommunityByIdParish } from "@/types/community";
import { CardCommunityList } from "./CardCommunityList";


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
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching communities", error);
        setError("Hubo un error al obtener las comunidades.");
        setLoading(false);
      }
    };

    fetchCommunities();

  }, [id])
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
        <CardCommunityList
          filteredCommunities={filteredCommunities}
          filters={filters}
        />
      )}
    </div>
  )
}