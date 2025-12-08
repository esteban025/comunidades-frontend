# Gestión de Reorganización y Fusión de Comunidades

Este documento explica cómo gestionar la reorganización de comunidades cuando estas se fusionan o cambian de número.

## Escenarios Comunes

### Escenario 1: Fusión de Comunidades
**Ejemplo:** Las comunidades 2 y 3 se fusionan en la comunidad 2.

**Proceso:**
1. Usar el endpoint `/api/communities/merge` para fusionar
2. Todos los hermanos de la comunidad 3 pasan a la comunidad 2
3. Todos los roles se transfieren
4. La comunidad 3 se elimina
5. Opcionalmente, reorganizar los números de las comunidades restantes

### Escenario 2: Reorganización de Números
**Ejemplo:** Después de fusionar 2 y 3, las comunidades 4 y 5 ahora deben ser 3 y 4.

**Proceso:**
1. Usar el endpoint `/api/communities/reorganize` para renumerar
2. Se actualizan los números sin perder historial ni relaciones

---

## Endpoints Disponibles

### 1. Fusionar Comunidades
**Endpoint:** `POST /api/communities/merge`

**Propósito:** Fusiona varias comunidades en una sola, transfiriendo todos los hermanos y roles.

**Body:**
```json
{
  "targetCommunityId": 5,
  "sourceCommunityIds": [8, 12]
}
```

**Proceso interno:**
1. Valida que todas las comunidades existen y son de la misma parroquia
2. Transfiere hermanos a la comunidad destino
3. Elimina roles duplicados (si un hermano tiene el mismo rol en ambas comunidades)
4. Transfiere roles únicos
5. Elimina las comunidades fuente

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "2 comunidad(es) fusionada(s) exitosamente",
  "data": {
    "targetCommunityId": 5,
    "mergedCommunityIds": [8, 12],
    "parishId": 1
  }
}
```

**Ejemplo de uso en JavaScript:**
```javascript
async function mergeCommunities(targetId, sourceIds) {
  const response = await fetch('/api/communities/merge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      targetCommunityId: targetId,
      sourceCommunityIds: sourceIds
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('Fusión exitosa:', result.message);
    // Recargar página o actualizar UI
    location.reload();
  } else {
    console.error('Error:', result.error);
  }
}

// Ejemplo: Fusionar comunidades 2 y 3 en la comunidad 2
mergeCommunities(2, [3]);
```

---

### 2. Reorganizar Números de Comunidades
**Endpoint:** `POST /api/communities/reorganize`

**Propósito:** Actualiza los números de múltiples comunidades en una parroquia sin afectar datos.

**Body:**
```json
{
  "parishId": 1,
  "updates": [
    { "communityId": 15, "newNumber": 3 },
    { "communityId": 18, "newNumber": 4 }
  ]
}
```

**Proceso interno:**
1. Inicia transacción para garantizar atomicidad
2. Valida que cada comunidad pertenece a la parroquia
3. Actualiza el campo `number_community` de cada una
4. Si hay error, revierte todos los cambios (ROLLBACK)

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Comunidades reorganizadas exitosamente"
}
```

**Ejemplo de uso en JavaScript:**
```javascript
async function reorganizeCommunities(parishId, updates) {
  const response = await fetch('/api/communities/reorganize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parishId: parishId,
      updates: updates
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('Reorganización exitosa');
    location.reload();
  } else {
    console.error('Error:', result.error);
  }
}

// Ejemplo: Renumerar comunidades 4→3 y 5→4
reorganizeCommunities(1, [
  { communityId: 15, newNumber: 3 },
  { communityId: 18, newNumber: 4 }
]);
```

---

### 3. Actualizar Comunidad Individual
**Endpoint:** `PUT /api/communities/[id]`

**Propósito:** Actualiza el número o paso de una comunidad específica.

**Body:**
```json
{
  "number_community": 3,
  "level_paso": "Paso 5 - Catequista"
}
```

**Validaciones:**
- Verifica que no exista otra comunidad con el mismo número en la parroquia
- Valida que los campos requeridos estén presentes

**Ejemplo de uso:**
```javascript
async function updateCommunity(communityId, numberCommunity, levelPaso) {
  const response = await fetch(`/api/communities/${communityId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      number_community: numberCommunity,
      level_paso: levelPaso
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('Comunidad actualizada');
  } else {
    alert(result.error);
  }
}

// Ejemplo: Cambiar comunidad 5 al número 3
updateCommunity(15, 3, "Paso 5 - Catequista");
```

---

### 4. Eliminar Comunidad
**Endpoint:** `DELETE /api/communities/[id]`

**Propósito:** Elimina una comunidad vacía (sin hermanos).

**Validación:** No permite eliminar si tiene hermanos registrados.

**Ejemplo de uso:**
```javascript
async function deleteCommunity(communityId) {
  if (!confirm('¿Seguro que deseas eliminar esta comunidad?')) {
    return;
  }
  
  const response = await fetch(`/api/communities/${communityId}`, {
    method: 'DELETE'
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('Comunidad eliminada');
    location.reload();
  } else {
    alert(result.error);
  }
}
```

---

## Flujo Completo: Ejemplo Práctico

**Situación:** Las comunidades 2 y 3 se fusionan. Después, las comunidades 4 y 5 deben renumerarse a 3 y 4.

```javascript
async function reorganizeParish() {
  try {
    // Paso 1: Fusionar comunidades 2 y 3
    console.log('Paso 1: Fusionando comunidades 2 y 3...');
    const mergeResponse = await fetch('/api/communities/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetCommunityId: 2,  // ID real de la comunidad 2
        sourceCommunityIds: [3] // ID real de la comunidad 3
      })
    });
    
    const mergeResult = await mergeResponse.json();
    if (!mergeResult.success) {
      throw new Error(mergeResult.error);
    }
    
    console.log('✓ Fusión completada');
    
    // Paso 2: Renumerar comunidades restantes
    console.log('Paso 2: Renumerando comunidades 4→3 y 5→4...');
    const reorganizeResponse = await fetch('/api/communities/reorganize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parishId: 1,
        updates: [
          { communityId: 4, newNumber: 3 }, // Comunidad 4 ahora es 3
          { communityId: 5, newNumber: 4 }  // Comunidad 5 ahora es 4
        ]
      })
    });
    
    const reorganizeResult = await reorganizeResponse.json();
    if (!reorganizeResult.success) {
      throw new Error(reorganizeResult.error);
    }
    
    console.log('✓ Reorganización completada');
    console.log('✅ Proceso completo exitoso');
    
    // Recargar para ver cambios
    location.reload();
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error.message);
    alert('Hubo un error: ' + error.message);
  }
}

// Ejecutar
reorganizeParish();
```

---

## Consideraciones Importantes

### 1. **Integridad de Datos**
- El sistema mantiene **todos los hermanos** al fusionar
- Los **roles no se pierden**, solo se transfieren
- Se eliminan **roles duplicados** automáticamente
- Las **relaciones con parroquias** se preservan

### 2. **IDs vs Números**
- **ID de comunidad**: Identificador único en la base de datos (nunca cambia)
- **Número de comunidad**: Número visible (1, 2, 3...) que sí puede cambiar
- Los hermanos siempre están vinculados al **ID**, no al número

### 3. **Transacciones**
- Todas las operaciones usan transacciones SQL
- Si algo falla, **todo se revierte** (ROLLBACK)
- Garantiza consistencia de datos

### 4. **Validaciones**
- No se puede fusionar una comunidad consigo misma
- Solo se pueden fusionar comunidades de la misma parroquia
- No se puede eliminar una comunidad con hermanos
- No se pueden tener dos comunidades con el mismo número en una parroquia

---

## Próximos Pasos Sugeridos

### 1. Crear Interfaz de Usuario
Componente para gestionar fusiones y reorganizaciones:

```astro
---
// src/components/ModalManageCommunities.astro
---
<div class="modal">
  <h2>Gestionar Comunidades</h2>
  
  <section>
    <h3>Fusionar Comunidades</h3>
    <select id="target-community">
      <!-- Opciones de comunidades -->
    </select>
    <select id="source-communities" multiple>
      <!-- Comunidades a fusionar -->
    </select>
    <button onclick="handleMerge()">Fusionar</button>
  </section>
  
  <section>
    <h3>Reorganizar Números</h3>
    <div id="reorder-list">
      <!-- Lista arrastrable de comunidades -->
    </div>
    <button onclick="handleReorganize()">Aplicar Cambios</button>
  </section>
</div>
```

### 2. Agregar Historial de Cambios
Tabla para registrar fusiones y reorganizaciones:

```sql
CREATE TABLE community_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  action_type ENUM('merge', 'reorganize', 'update') NOT NULL,
  old_data JSON,
  new_data JSON,
  performed_by VARCHAR(255),
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Confirmaciones y Validaciones
- Agregar diálogos de confirmación
- Mostrar preview de cambios antes de aplicar
- Permitir deshacer operaciones recientes

---

## Resumen

✅ **Ventajas de este sistema:**
- Mantiene integridad referencial
- No pierde datos de hermanos ni roles
- Permite reorganizar sin afectar relaciones
- Usa transacciones para seguridad
- Flexible para cambios futuros

✅ **Casos cubiertos:**
- Fusión de 2+ comunidades
- Renumeración masiva
- Actualización individual
- Eliminación segura

✅ **Listo para producción:**
- Validaciones robustas
- Manejo de errores
- Rollback automático en fallos
