import type { Parish } from "@/types/parishes"
import { EditIcon, TrashIcon } from "./iconsForReact";

interface Props {
  parish: Parish;
  index: number;
  functionEdit?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  functionDelete?: () => void;
}
export const CardParishList = ({ parish, index, functionEdit, functionDelete }: Props) => {
  return (
    <div className="card relative group card-entry" style={{ animationDelay: `${index * 100}ms` }} key={parish.id}>
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
          onClick={functionEdit}
        >
          <EditIcon className="size-5" />
        </button>
        <button
          className="atn-btn"
          title="Eliminar Parroquia"
          onClick={functionDelete}
        >
          <TrashIcon className="size-5 text-red-400 hover:text-red-600" />
        </button>
      </div>
    </div>
  )
}