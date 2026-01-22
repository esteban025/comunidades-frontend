import { useEffect, useState } from "react";
import { FilterList } from "./FilterList";
import { EditIcon, TrashIcon } from "./iconsForReact";
import type { CommunityByIdParish } from "@/types/community";


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
      {loading && <p>Cargando comunidades...</p>}
      {error && <p className="bg-red-50/50 text-red-500 p-3 py-6 w-full rounded-xl border text-center border-dashed">{error}</p>}
      {!loading && !error && (
        <div className="content-cards grid gap-6 grid-cols-1">
          {filteredCommunities.map(({ id, level_paso, number_community, brothers_count, responsables }) => (
            <div className="card relative group h-full" key={id}>
              <div className="group-hover:scale-[98%] transition-transform duration-300 ease-in-out h-full">
                <a href={`/details-community/${id}`} className="p-4 rounded-xl border border-gray-300 shadow-sm hover:shadow-lg transition-shadow duration-200 ease-in-out flex flex-col gap-2 h-full w-full cursor-pointer">
                  <header className="text-left flex justify-between ">
                    <div>
                      <h2 className="text-xl font-semibold truncate">{responsables}</h2>
                      <p className="text-description text-sm">{level_paso}</p>
                    </div>
                    <span className="size-10 bg-neutral-800 text-neutral-50 rounded-full flex justify-center items-center font-semibold">{number_community}</span>
                  </header>
                  <footer className="flex justify-between items-center">

                    <span className="text-neutral-400 text-sm">{brothers_count}
                      <span className="text-xs ml-2">Hermanos</span>
                    </span>
                  </footer>
                </a>
              </div>
              <div className="absolute bottom-3 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out flex gap-2 group-hover:right-7 ">
                <button
                  className="edit-parish-btn atn-btn"
                  title="Editar Parroquia"
                >
                  <EditIcon className="size-5" />
                </button>
                <button
                  className="atn-btn"
                  title="Eliminar Parroquia"
                >
                  <TrashIcon className="size-5 text-red-400 hover:text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}