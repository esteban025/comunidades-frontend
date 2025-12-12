export interface AttendanceTotals {
  totalPeople: number;
  totalMarriages: number;
  totalSinglesMale: number;
  totalSinglesFemale: number;
}

export interface AttendanceTotalsSource {
  civil_status?: string | null;
  is_marriage?: boolean;
  [key: string]: any;
}

export function calculateAttendanceTotals<T extends AttendanceTotalsSource>(
  entries: T[],
): AttendanceTotals {
  let totalPeople = 0;
  let totalMarriages = 0;
  let totalSinglesMale = 0;
  let totalSinglesFemale = 0;

  for (const entry of entries) {
    if (entry.is_marriage) {
      totalPeople += 2;
      totalMarriages += 1;
      continue;
    }

    totalPeople += 1;

    const status = (entry.civil_status || "").toLowerCase();

    if (status === "soltero") {
      totalSinglesMale += 1;
    } else if (status === "soltera") {
      totalSinglesFemale += 1;
    }
  }

  return {
    totalPeople,
    totalMarriages,
    totalSinglesMale,
    totalSinglesFemale,
  };
}
