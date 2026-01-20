import { pasosCamino } from './pasos-camino';

// Convertir el objeto de pasos en una lista plana
export function getPasosList(): string[] {
  const pasos: string[] = [];

  // Agregar inicio
  pasos.push(pasosCamino.inicio.inicio1);
  pasos.push(pasosCamino.inicio.inicio2);

  // Agregar pasos del precatecumenado
  pasos.push(pasosCamino.precatecumenado.primerPaso);
  pasos.push(pasosCamino.precatecumenado.segundoPaso);
  pasos.push(pasosCamino.precatecumenado.tercerPaso);

  // Agregar pasos del catecumenado
  pasos.push(pasosCamino.catecumenado.primerPaso);
  pasos.push(pasosCamino.catecumenado.segundoPaso);
  pasos.push(pasosCamino.catecumenado.tercerPaso);
  pasos.push(pasosCamino.catecumenado.cuartoPaso);
  pasos.push(pasosCamino.catecumenado.quintoPaso);

  // Agregar pasos de elección
  pasos.push(pasosCamino.eleccion.primerPaso);
  pasos.push(pasosCamino.eleccion.segundoPaso);
  pasos.push(pasosCamino.eleccion.tercerPaso);

  return pasos;
}

// Exportar la lista directamente
export const pasosListaPlana = getPasosList();
