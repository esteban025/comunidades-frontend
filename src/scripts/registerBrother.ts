export async function registerBrother(formData: FormData) {
  try {
    // Construir el objeto de datos
    const civil_status = formData.get('civil_status') as string;

    const data: any = {
      civil_status,
      parish_id: parseInt(formData.get('parish_id') as string),
      community_number: parseInt(formData.get('community_number') as string),
      level_paso: formData.get('level_paso') as string || undefined,
      phone: formData.get('phone') as string || undefined,
      roles_in_own_community: [],
      catechist_communities: []
    };

    // Nombres según estado civil
    if (civil_status === 'matrimonio') {
      data.husband_name = formData.get('husband_name') as string;
      data.wife_name = formData.get('wife_name') as string;

      // Teléfonos por cónyuge (opcionales)
      data.husband_phone = (formData.get('husband_phone') as string) || undefined;
      data.wife_phone = (formData.get('wife_phone') as string) || undefined;
    } else {
      data.full_name = formData.get('full_name') as string;
    }

    // Roles en su propia comunidad
    const roles = formData.getAll('roles_in_own_community');
    if (roles.length > 0) {
      data.roles_in_own_community = roles;
    }

    // Comunidades donde es catequista
    const catechistCount = parseInt(formData.get('catechist_count') as string || '0');
    for (let i = 0; i < catechistCount; i++) {
      const parishId = formData.get(`catechist_parish_${i}`);
      const commNumber = formData.get(`catechist_community_${i}`);
      if (parishId && commNumber) {
        data.catechist_communities.push({
          parish_id: parseInt(parishId as string),
          community_number: parseInt(commNumber as string)
        });
      }
    }

    const response = await fetch('/api/brothers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return { success: true, data: result.data, message: result.message };
    } else {
      return { success: false, error: result.error || 'Error al registrar el hermano' };
    }
  } catch (error) {
    console.error('Error en el registro:', error);
    return { success: false, error: 'Error de conexión con el servidor' };
  }
}
