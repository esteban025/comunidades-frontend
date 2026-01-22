import type { CommunityByIdParish } from "@/types/community";
import { EditIcon, TrashIcon } from "./iconsForReact"

interface Props {
  filteredCommunities: Omit<CommunityByIdParish, 'parish_id'>[];
  filters: {
    numberCommunity: string;
    nameResponsible: string;
    pairsOrImpares: string;
  };
  // handleEdit?: (id: number) => void;
  handleDelete?: (id: number) => void;
}
export const CardCommunityList = ({ filteredCommunities, filters }: Props) => {

  const handleDelete = async (id: number) => {
    const confirmDelete = confirm(`Eliminar comunidad con ID: ${id}`);

    if (!confirmDelete) return

    try {
      const res = await fetch(`/api/communities/${id}`, {
        method: "DELETE",
      });
      const result = await res.json()
      if (!result.ok || !result.success) {
        alert("Hubo un fallo al eliminar la comunidad.");
        return;
      }
    } catch (error) {
      const msg = `error: ${error}`;
      alert(msg);
    }


  }
  return (
    <div
      key={`${filters.numberCommunity}-${filters.nameResponsible}-${filters.pairsOrImpares}`}
      className="content-cards grid gap-6 grid-cols-1"
    >
      {filteredCommunities.map(({ id, level_paso, number_community, brothers_count, responsables }, index) => (
        <div
          className="card relative group h-full card-entry"
          style={{ animationDelay: `${index * 100}ms` }}
          key={id}
        >
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
              onClick={() => handleDelete(id)}
            >
              <TrashIcon className="size-5 text-red-400 hover:text-red-600" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}