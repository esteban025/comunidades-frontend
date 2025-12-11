export interface BasicBrother {
  id: number;
  spouse_id?: number | null;
  civil_status?: string | null;
  names: string;
  // Permitir cualquier otro campo adicional
  [key: string]: any;
}

// Agrupa matrimonios para tablas basadas en "id" (por ejemplo, registros generales de hermanos).
// Siempre trata como "esposo" al registro con id menor y devuelve una lista donde
// los matrimonios aparecen en una sola fila con nombres combinados "Esposo y Esposa".
export function groupMarriagesById<T extends BasicBrother>(brothers: T[]): T[] {
  const byId = new Map<number, T>();
  brothers.forEach((b) => byId.set(b.id, b));

  const used = new Set<number>();
  const result: T[] = [];

  for (const brother of brothers) {
    if (used.has(brother.id)) continue;

    if (
      brother.civil_status === "matrimonio" &&
      brother.spouse_id &&
      byId.has(brother.spouse_id)
    ) {
      const spouse = byId.get(brother.spouse_id)!;

      const husband = brother.id < spouse.id ? brother : spouse;
      const wife = husband.id === brother.id ? spouse : brother;

      used.add(husband.id);
      used.add(wife.id);

      const combinedName = `${husband.names} y ${wife.names}`;

      result.push({
        ...(husband as any),
        spouse_id: wife.id,
        names: combinedName,
      });
    } else {
      used.add(brother.id);
      result.push(brother);
    }
  }

  return result;
}

export interface AttendeeBrother {
  brother_id: number;
  spouse_id?: number | null;
  names: string;
  civil_status?: string | null;
  attended?: any;
  [key: string]: any;
}

export interface GroupedAttendanceEntry extends AttendeeBrother {
  is_marriage: boolean;
  // Para matrimonios
  husband_id?: number;
  wife_id?: number;
  husband_name?: string;
  wife_name?: string;
  attended_husband?: boolean;
  attended_wife?: boolean;
}

// Agrupa matrimonios para tablas de asistencia (confirmados / invitados) basadas en brother_id.
// Devuelve estructuras compatibles con las tablas existentes, pero garantizando
// el orden esposo (id menor) y esposa (id mayor).
export function groupMarriagesForAttendance<T extends AttendeeBrother>(
  brothers: T[],
): GroupedAttendanceEntry[] {
  const byId = new Map<number, T>();
  brothers.forEach((b) => byId.set(b.brother_id, b));

  const used = new Set<number>();
  const result: GroupedAttendanceEntry[] = [];

  for (const b of brothers as T[]) {
    if (used.has(b.brother_id)) continue;

    if (b.spouse_id && byId.has(b.spouse_id)) {
      const spouse = byId.get(b.spouse_id)!;

      const husband = b.brother_id < spouse.brother_id ? b : spouse;
      const wife = husband.brother_id === b.brother_id ? spouse : b;

      used.add(husband.brother_id);
      used.add(wife.brother_id);

      result.push({
        ...(husband as any),
        names: `${husband.names} y ${wife.names}`,
        is_marriage: true,
        husband_id: husband.brother_id,
        wife_id: wife.brother_id,
        husband_name: husband.names,
        wife_name: wife.names,
        attended_husband: Boolean(husband.attended),
        attended_wife: Boolean(wife.attended),
      });
    } else {
      used.add(b.brother_id);
      result.push({
        ...(b as any),
        is_marriage: false,
      });
    }
  }

  return result;
}

export interface BillingEntrySource extends AttendeeBrother {
  observations?: string | null;
  casa_name?: string | null;
}

export interface BillingEntry {
  tipo: string;
  nombres: string;
  observaciones: string;
  hospedaje: string;
  cantidad: number;
}

// Agrupa matrimonios para cobros a partir de asistentes confirmados de una comunidad.
// Si ambos cónyuges asistieron, se genera una sola entrada con cantidad = 2 y
// nombres combinados; si solo uno asistió, se genera una entrada individual.
export function groupMarriagesForBilling<T extends BillingEntrySource>(
  attendees: T[],
): BillingEntry[] {
  const byId = new Map<number, T>();
  attendees.forEach((b) => byId.set(b.brother_id, b));

  const used = new Set<number>();
  const result: BillingEntry[] = [];

  for (const b of attendees as T[]) {
    if (used.has(b.brother_id)) continue;

    if (b.spouse_id && byId.has(b.spouse_id)) {
      const spouse = byId.get(b.spouse_id)!;

      used.add(b.brother_id);
      used.add(spouse.brother_id);

      result.push({
        tipo: (b.civil_status || "") as string,
        nombres: `${b.names} y ${spouse.names}`,
        observaciones: (b.observations || spouse.observations || "") as string,
        hospedaje:
          (b.casa_name || spouse.casa_name || "No especificado") as string,
        cantidad: 2,
      });
    } else {
      used.add(b.brother_id);
      result.push({
        tipo: (b.civil_status || "") as string,
        nombres: b.names,
        observaciones: (b.observations || "") as string,
        hospedaje: (b.casa_name || "No especificado") as string,
        cantidad: 1,
      });
    }
  }

  return result;
}
