export async function registerParish(formData: FormData, isEditMode = false) {
  const parishId = formData.get('parish-id') as string;
  const parishData = {
    name: formData.get('parish-name') as string,
    tag: formData.get('parish-tag') as string,
    aka: formData.get('parish-aka') as string,
  };

  try {
    const url = isEditMode ? `/api/parishes/${parishId}` : '/api/parishes';
    const method = isEditMode ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parishData),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error || 'Error al procesar la solicitud' };
    }
  } catch (error) {
    console.error('Error en el registro:', error);
    return { success: false, error: 'Error de conexión con el servidor' };
  }
}

