export const FilterList = ({ filters, onChange }: { filters: { numberCommunity: string; nameResponsible: string; pairsOrImpares: string }; onChange: React.Dispatch<React.SetStateAction<{ numberCommunity: string; nameResponsible: string; pairsOrImpares: string }>> }) => {
  const handleReset = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onChange({ numberCommunity: "", nameResponsible: "", pairsOrImpares: "" });
  }

  return (
    <div className="form-filters flex flex-col gap-4 my-10">
      <h2 className="text-xl font-semibold">Filtrar Comunidades</h2>
      <form action="" className="flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="content-input">
            <label htmlFor="number-comm">Numero de comunidad:</label>
            <input type="number" name="number-comm" id="number-comm" value={filters.numberCommunity} onChange={e => onChange(prev => ({ ...prev, numberCommunity: e.target.value }))} />
          </div>
          <div className="content-input">
            <label htmlFor="name-resp">Nombre del responsable</label>
            <input type="text" name="name-resp" id="name-resp" value={filters.nameResponsible} onChange={e => onChange(prev => ({ ...prev, nameResponsible: e.target.value }))} />
          </div>
          <div className="content-input">
            <label htmlFor="pairs">Pares o Impares</label>
            <select
              name="pairs"
              id="pairs"
              className="select-input"
              value={filters.pairsOrImpares}
              onChange={e => onChange(prev => ({ ...prev, pairsOrImpares: e.target.value }))}
            >
              <option className="options-select" value="">-- Selecciona una opción --</option>
              <option className="options-select" value="pairs">Pares</option>
              <option className="options-select" value="impares">Impares</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleReset}>Limpiar filtros</button>
      </form>
    </div>
  );
}