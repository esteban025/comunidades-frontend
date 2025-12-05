# ANÁLISIS Y PREGUNTAS PARA REGISTRO DE HERMANOS

## Tu Objetivo
Crear un formulario de registro donde un hermano pueda inscribirse y automáticamente se creen/actualicen las relaciones necesarias en la base de datos.

## Mi Análisis del Flujo

### Escenario 1: Hermano sin rol especial
**Datos necesarios:**
- Nombres y apellidos
- Estado civil (matrimonio/soltero/soltera)
- Parroquia (selector de las existentes)
- Número de comunidad
- Teléfono (opcional)

**Proceso:**
1. Si la comunidad NO existe → crearla automáticamente
2. Insertar el hermano en la tabla `brothers`
3. NO crear registro en `brother_roles` (porque no tiene rol)

### Escenario 2: Hermano con rol (responsable, corresponsable, didascala, ostiario)
**Datos adicionales:**
- Rol que desempeña

**Proceso:**
1. Crear/verificar comunidad
2. Insertar hermano
3. Insertar rol en `brother_roles`

### Escenario 3: Catequista
**Datos adicionales:**
- Comunidad(es) a las que sirve (puede ser múltiple)
- Parroquia(s) de esas comunidades

**Proceso:**
1. Crear/verificar su propia comunidad (porque los catequistas también tienen comunidad)
2. Insertar hermano
3. Para cada comunidad que sirve → insertar en `community_catechists`

---

## MIS PREGUNTAS IMPORTANTES

### 1. Sobre el Formulario de Registro

**P1:** ¿El formulario será UNO SOLO que se adapte según las respuestas, o prefieres formularios separados?
- Opción A: Un formulario dinámico (si marca "soy catequista" → aparecen campos adicionales)
- Opción B: Tres botones: "Registrar Hermano", "Registrar Responsable/Corresponsable", "Registrar Catequista"

**P2:** Si alguien es catequista Y tiene otro rol (ej: responsable), ¿cómo lo registramos?
- ¿Puede marcar ambos?
- ¿Son campos independientes?

### 2. Sobre Creación Automática de Comunidades

**P3:** Cuando un hermano se registra y dice "soy de la comunidad 5 de la parroquia X":
- Si esa comunidad NO existe → ¿la creamos automáticamente con solo el número y parroquia?
- ¿O debería existir un proceso previo de "crear comunidad completa" con todos sus datos?

**P4:** Si se crea automáticamente, ¿qué pasa con el campo `level_paso` de la comunidad?
- ¿Lo dejamos NULL?
- ¿Pedimos ese dato al hermano?
- ¿Lo ignoramos por ahora?

### 3. Sobre Matrimonios

**P5:** Cuando un matrimonio se registra:
- ¿Se registran JUNTOS en un solo formulario? ("Juan Pérez y María López")
- ¿O cada uno se registra por separado y luego los enlazamos?

**P6:** Si es un matrimonio responsable o corresponsable:
- ¿El registro es uno solo con ambos nombres?
- ¿Cómo manejamos el teléfono? (¿de quién es?)

### 4. Sobre Catequistas y Comunidades Múltiples

**P7:** Cuando un catequista se registra:
- ¿Puede agregar TODAS las comunidades que sirve en ese momento?
- ¿O solo registra su comunidad principal y luego hay otra forma de agregar más?

**P8:** ¿Un catequista puede servir en comunidades de DIFERENTES parroquias?
- Si es así, ¿necesitamos un selector múltiple de parroquias y comunidades?

### 5. Sobre Validaciones

**P9:** ¿Quieres validaciones estrictas? Por ejemplo:
- Solo 1 responsable por comunidad
- Solo 2 corresponsables matrimonio por comunidad
- Solo 1 soltero y 1 soltera corresponsable por comunidad
- ¿O dejamos que se registren libremente y luego tú corriges?

**P10:** ¿Puede haber hermanos duplicados?
- ¿Validamos por nombre completo?
- ¿O permitimos duplicados? (ej: dos "Juan Pérez" en diferentes comunidades)

---

## MI PROPUESTA INICIAL (sujeta a tus respuestas)

### Opción A: Formulario Progresivo Inteligente

**Paso 1: Datos Básicos**
```
- Nombres y apellidos
- Estado civil (radio: matrimonio/soltero/soltera)
- Teléfono (opcional)
```

**Paso 2: Ubicación**
```
- Parroquia (select de las existentes)
- Número de comunidad (input numérico)
```

**Paso 3: Roles (opcional)**
```
☐ Soy catequista
☐ Tengo un rol en mi comunidad (responsable, corresponsable, didascala, ostiario)

Si marca "catequista":
  → Agregar comunidades que sirve (múltiple select)
  
Si marca "rol en comunidad":
  → Select de rol específico
```

### Función Backend Propuesta

```typescript
async function registerBrother(data) {
  // 1. Verificar/crear comunidad propia
  let community = await findCommunity(data.parish_id, data.number_community);
  if (!community) {
    community = await createCommunity({
      parish_id: data.parish_id,
      number_community: data.number_community,
      level_paso: null
    });
  }
  
  // 2. Insertar hermano
  const brother = await insertBrother({
    names: data.names,
    civil_status: data.civil_status,
    community_id: community.id,
    phone: data.phone
  });
  
  // 3. Si tiene rol en SU comunidad
  if (data.role && data.role !== 'ninguno') {
    await insertBrotherRole({
      brother_id: brother.id,
      community_id: community.id,
      role: data.role
    });
  }
  
  // 4. Si es catequista de otras comunidades
  if (data.is_catechist && data.catechist_communities) {
    for (let commId of data.catechist_communities) {
      await insertCommunityCatechist({
        community_id: commId,
        catechist_id: brother.id
      });
    }
  }
  
  return brother;
}
```

---

## LO QUE NECESITO DE TI

Por favor responde las 10 preguntas (P1-P10) para que pueda desarrollar exactamente lo que necesitas.

También dime:
- ¿Te gusta la propuesta del formulario progresivo?
- ¿Prefieres algo más simple o más complejo?
- ¿Hay algo que no consideré?

Una vez tengas claras las respuestas, empezaré a desarrollar el modal de registro con toda la lógica necesaria.

## RESPUESTAS Y PLAN FINAL

### Respuestas Clave:
1. ✅ Formulario dinámico adaptable
2. ✅ Un hermano puede ser catequista Y responsable/corresponsable
3. ✅ Comunidades se crean automáticamente si no existen
4. ✅ Pedimos `level_paso` solo cuando se crea la comunidad
5. ✅ Matrimonios: un registro, dos inputs (esposo/esposa), concatenados
6. ✅ Catequistas pueden servir múltiples parroquias/comunidades
7. ✅ VALIDACIÓN ESTRICTA: Solo 1 responsable por comunidad
8. ✅ No duplicados en la misma comunidad (pero sí en diferentes)

---

## PLAN DE IMPLEMENTACIÓN

### Fase 1: Actualizar Base de Datos

**Problema detectado:** La estructura actual no permite que un hermano sea catequista Y tenga otro rol.

**Solución:** Los catequistas también deben poder tener roles en `brother_roles`.

```sql
-- La tabla brother_roles ya permite esto, solo agregamos 'catequista' como rol
ALTER TABLE brother_roles 
MODIFY role ENUM('responsable', 'corresponsable', 'didascala', 'ostiario', 'catequista') NOT NULL;

-- Eliminar la tabla community_catechists (redundante)
-- Ahora usaremos brother_roles para todo, incluyendo catequistas
```

**Nueva estructura:**
- Un hermano puede tener MÚLTIPLES roles en DIFERENTES comunidades
- Ejemplo: Juan es responsable de comunidad 3 en parroquia A, y catequista de comunidad 5 en parroquia B

### Fase 2: Formulario de Registro Dinámico

**Campos del formulario:**

**Sección 1: Datos Personales**
```
- Estado civil: [Radio] matrimonio / soltero / soltera
- Si matrimonio:
  - Nombre del esposo: [input]
  - Nombre de la esposa: [input]
- Si soltero/soltera:
  - Nombre completo: [input]
- Teléfono (opcional): [input]
```

**Sección 2: Mi Comunidad**
```
- Parroquia: [Select de parroquias existentes]
- Número de comunidad: [input number]
- ¿Esta comunidad ya existe? [Verificación automática]
  - Si NO existe → Pedir: "¿En qué paso está?" [input]
  - Si SÍ existe → Mostrar: "Comunidad encontrada: Paso X"
```

**Sección 3: Mis Roles (Opcional)**
```
☐ Soy responsable de mi comunidad
☐ Soy corresponsable de mi comunidad
☐ Soy didascala de mi comunidad
☐ Soy ostiario de mi comunidad
☐ Soy catequista de otras comunidades

Si marca "Soy responsable":
  → Validar que no exista otro responsable en esa comunidad
  
Si marca "Soy catequista":
  → Botón "Agregar comunidad que sirvo"
  → Por cada comunidad:
    - Parroquia: [Select]
    - Número de comunidad: [input]
    - (Se puede agregar múltiples)
```

### Fase 3: Lógica Backend (API)

**Endpoint:** `POST /api/brothers`

```typescript
{
  // Datos personales
  civil_status: "matrimonio" | "soltero" | "soltera",
  husband_name?: string,  // si matrimonio
  wife_name?: string,     // si matrimonio
  full_name?: string,     // si soltero/soltera
  phone?: string,
  
  // Su comunidad
  parish_id: number,
  community_number: number,
  level_paso?: string,  // solo si la comunidad no existe
  
  // Sus roles
  roles: {
    in_own_community: ["responsable", "corresponsable", "didascala", "ostiario"],
    as_catechist: [
      { parish_id: number, community_number: number }
    ]
  }
}
```

**Proceso:**
1. Concatenar nombres si es matrimonio
2. Verificar/crear comunidad propia
3. Validar que no exista duplicado en esa comunidad
4. Si es responsable → validar que no haya otro responsable
5. Insertar hermano
6. Insertar roles en su comunidad
7. Verificar/crear comunidades donde es catequista
8. Insertar rol de catequista en esas comunidades

---

## SIGUIENTE PASO

¿Quieres que empiece con:
1. Actualizar el SQL de la base de datos
2. Crear el modal de registro de hermanos
3. Crear la API completa

O prefieres que haga todo de una vez?
