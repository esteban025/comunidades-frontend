import type React from "react";
import { SearchIcon, PlusIcon, RefreshIcon, ArrowShortIcon } from "./iconsForReact";

interface FilterListProps {
  filters: {
    numberCommunity: string;
    nameResponsible: string;
    pairsOrImpares: string;
  };
  onChange: React.Dispatch<React.SetStateAction<{
    numberCommunity: string;
    nameResponsible: string;
    pairsOrImpares: string;
  }>>;
}
export const FilterList = ({ filters, onChange }: FilterListProps) => {
  const handleReset = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onChange({ numberCommunity: "", nameResponsible: "", pairsOrImpares: "" });
  };

  const handleClearSearch = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onChange((prev) => ({ ...prev, nameResponsible: "" }));
  };

  return (
    <section className="flex justify-end items-center">
      <div className="grid grid-cols-3 gap-2">
        {/* buscador */}
        <div className="relative flex items-center w-full">
          {/* <SearchIcon
            className="absolute left-4 w-5 aspect-square block text-text-secondary pointer-events-none"
          /> */}
          <div className="content-input w-full">
            <input
              type="text"
              id="search-input"
              placeholder="Buscar hermano..."
              className="search-input"
              autoComplete="off"
              value={filters.nameResponsible}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, nameResponsible: e.target.value }))
              }
            />
          </div>
          <button
            className="absolute right-4 w-8 aspect-square border-none bg-gray-200 rounded-full items-center justify-center cursor-pointer text-text-secondary transition-all duration-200 hover:bg-gray-300 hover:text-text-purple-500 clear-search-btn"
            id="clear-search-btn"
            title="Limpiar búsqueda"
            onClick={handleClearSearch}
          >
            <PlusIcon className="size-4 transform rotate-45" />
          </button>
        </div>

        {/* pares e impares */}
        <div className="pirs-container w-full relative">
          <select
            name="pairs-select"
            id="pairs-select"
            className="select-input"
            value={filters.pairsOrImpares}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, pairsOrImpares: e.target.value }))
            }
          >
            <option className="options-select" value="">Todos</option>
            <option className="options-select" value="pairs">Pares</option>
            <option className="options-select" value="impares">Impares</option>
          </select>
          <ArrowShortIcon className="size-4 block icon-select" />
        </div>
        <button
          id="clean-filters"
          className="btn btn-primary flex items-center gap-2 justify-center"
          onClick={handleReset}
        >
          <RefreshIcon className="size-4 block" />
          <span>Limpiar filtros</span>
        </button>
      </div>
    </section>
  );
}