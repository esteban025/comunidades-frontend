# Sistema de Gestión de Convivencias - Plan de Implementación

## 📋 Resumen del Flujo

1. **Crear Convivencia** → Fechas + Selección de Comunidades (multi-parroquia)
2. **Lista de Hermanos Elegibles** → Todos los hermanos de las comunidades seleccionadas
3. **Marcar Asistencia** → Quién SÍ va + Observaciones especiales
4. **Asignar Casas** → Distribuir asistentes en diferentes casas de convivencia

---

## 🗄️ PASO 1: Estructura de Base de Datos

### Tablas Necesarias

#### 1.1. Tabla `convivencias`
```sql
CREATE TABLE convivencias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  status ENUM('planificada', 'en_curso', 'finalizada') DEFAULT 'planificada',
  total_capacity INT,  -- Capacidad total entre todas las casas
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 1.2. Tabla `convivencia_communities` (Comunidades invitadas)
```sql
CREATE TABLE convivencia_communities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  convivencia_id INT NOT NULL,
  community_id INT NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (convivencia_id) REFERENCES convivencias(id) ON DELETE CASCADE,
  FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
  UNIQUE KEY unique_community_convivencia (convivencia_id, community_id)
);
```

#### 1.3. Tabla `casas_convivencia` (Casas/Sedes físicas)
```sql
CREATE TABLE casas_convivencia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  capacity INT NOT NULL,
  has_ground_floor_rooms BOOLEAN DEFAULT FALSE,  -- Tiene habitaciones en planta baja
  has_baby_facilities BOOLEAN DEFAULT FALSE,     -- Tiene facilidades para bebés
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 1.4. Tabla `convivencia_casas` (Relación Convivencia-Casas)
```sql
CREATE TABLE convivencia_casas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  convivencia_id INT NOT NULL,
  casa_id INT NOT NULL,
  capacity_assigned INT,  -- Cuántos hermanos se asignarán a esta casa
  FOREIGN KEY (convivencia_id) REFERENCES convivencias(id) ON DELETE CASCADE,
  FOREIGN KEY (casa_id) REFERENCES casas_convivencia(id) ON DELETE CASCADE,
  UNIQUE KEY unique_casa_convivencia (convivencia_id, casa_id)
);
```

#### 1.5. Tabla `convivencia_attendees` (Asistentes confirmados)
```sql
CREATE TABLE convivencia_attendees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  convivencia_id INT NOT NULL,
  brother_id INT NOT NULL,
  will_attend BOOLEAN DEFAULT FALSE,  -- Marcado como asistente
  casa_id INT,  -- Casa asignada (puede ser NULL si aún no se asigna)
  observations TEXT,  -- "Tercera edad - necesita planta baja", "Matrimonio con bebé"
  special_needs ENUM('ninguna', 'tercera_edad', 'bebe', 'movilidad_reducida', 'otra') DEFAULT 'ninguna',
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (convivencia_id) REFERENCES convivencias(id) ON DELETE CASCADE,
  FOREIGN KEY (brother_id) REFERENCES brothers(id) ON DELETE CASCADE,
  FOREIGN KEY (casa_id) REFERENCES casas_convivencia(id) ON DELETE SET NULL,
  UNIQUE KEY unique_attendance (convivencia_id, brother_id)
);
```

---

## 🎯 PASO 2: Endpoints API Necesarios

### 2.1. Gestión de Convivencias
- `POST /api/convivencias` - Crear nueva convivencia
- `GET /api/convivencias` - Listar todas las convivencias
- `GET /api/convivencias/[id]` - Obtener detalles de una convivencia
- `PUT /api/convivencias/[id]` - Actualizar convivencia
- `DELETE /api/convivencias/[id]` - Eliminar convivencia

### 2.2. Gestión de Comunidades en Convivencia
- `POST /api/convivencias/[id]/communities` - Agregar comunidades a la convivencia
  ```json
  {
    "community_ids": [1, 3, 5, 8, 12]
  }
  ```
- `GET /api/convivencias/[id]/communities` - Listar comunidades seleccionadas
- `DELETE /api/convivencias/[id]/communities/[communityId]` - Quitar comunidad

### 2.3. Gestión de Hermanos Elegibles
- `GET /api/convivencias/[id]/eligible-brothers` - Obtener todos los hermanos de las comunidades seleccionadas
  ```json
  {
    "success": true,
    "data": [
      {
        "brother_id": 1,
        "names": "Juan Pérez",
        "community_number": 2,
        "parish_name": "San Pedro",
        "will_attend": false,
        "casa_assigned": null,
        "observations": null
      }
    ],
    "total_eligible": 150,
    "total_attending": 0
  }
  ```

### 2.4. Gestión de Asistencia
- `POST /api/convivencias/[id]/attendees` - Marcar hermanos como asistentes
  ```json
  {
    "brother_id": 5,
    "will_attend": true,
    "observations": "Tercera edad - necesita habitación en planta baja",
    "special_needs": "tercera_edad"
  }
  ```
- `PUT /api/convivencias/[id]/attendees/[brotherId]` - Actualizar asistencia/observaciones
- `DELETE /api/convivencias/[id]/attendees/[brotherId]` - Quitar asistente

### 2.5. Gestión de Casas de Convivencia
- `POST /api/casas-convivencia` - Crear casa
- `GET /api/casas-convivencia` - Listar todas las casas disponibles
- `GET /api/casas-convivencia/[id]` - Detalles de una casa
- `PUT /api/casas-convivencia/[id]` - Actualizar casa
- `DELETE /api/casas-convivencia/[id]` - Eliminar casa

### 2.6. Asignación de Casas a Convivencia
- `POST /api/convivencias/[id]/casas` - Asignar casas a la convivencia
  ```json
  {
    "casa_assignments": [
      { "casa_id": 1, "capacity_assigned": 40 },
      { "casa_id": 3, "capacity_assigned": 35 },
      { "casa_id": 5, "capacity_assigned": 25 }
    ]
  }
  ```
- `GET /api/convivencias/[id]/casas` - Listar casas asignadas
- `DELETE /api/convivencias/[id]/casas/[casaId]` - Quitar casa de la convivencia

### 2.7. Asignación de Hermanos a Casas
- `PUT /api/convivencias/[id]/assign-casa` - Asignar hermanos a casas específicas
  ```json
  {
    "assignments": [
      { "brother_id": 1, "casa_id": 1 },
      { "brother_id": 2, "casa_id": 1 },
      { "brother_id": 3, "casa_id": 3 }
    ]
  }
  ```
- `GET /api/convivencias/[id]/casas/[casaId]/attendees` - Ver hermanos asignados a una casa

---

## 🎨 PASO 3: Componentes de UI

### 3.1. Página Principal de Convivencias
**Ruta:** `/convivencias`

**Componentes:**
- `ConvivenciasList.astro` - Lista de todas las convivencias
  - Tarjetas con: Nombre, Fechas, Estado, Total asistentes/capacidad
  - Botones: Ver, Editar, Eliminar
  - Botón "Nueva Convivencia"

### 3.2. Modal/Página: Crear Convivencia
**Componente:** `ModalCreateConvivencia.astro` o `/convivencias/new`

**Secciones:**
1. **Información Básica**
   - Nombre de la convivencia
   - Fecha inicio
   - Fecha fin
   - Descripción

2. **Selección de Comunidades**
   - Dropdown: Seleccionar parroquia
   - Checkboxes: Comunidades de esa parroquia
   - Botón "Agregar otra parroquia"
   - Lista resumen: Comunidades seleccionadas (con opción de quitar)
   - Total de hermanos elegibles mostrado en tiempo real

3. **Botón:** Crear Convivencia

### 3.3. Página de Gestión de Convivencia Individual
**Ruta:** `/convivencias/[id]`

**Componente:** `ConvivenciaDetail.astro`

**Tabs/Secciones:**

#### Tab 1: Información General
- Nombre, fechas, descripción
- Botón editar
- Estadísticas:
  - Total comunidades: 8
  - Total hermanos elegibles: 150
  - Total confirmados: 87
  - Casas asignadas: 3
  - Capacidad total: 100

#### Tab 2: Comunidades Participantes
- Lista de comunidades seleccionadas
- Por parroquia agrupadas
- Total de hermanos por comunidad
- Botón "Agregar más comunidades"
- Botón "Quitar comunidad"

#### Tab 3: Gestión de Asistentes ⭐ (Más importante)
**Componente:** `AttendanceManagement.astro`

**Estructura similar a ResumeBrothersRegisters pero con columnas diferentes:**

Tabla con columnas:
- Checkbox (seleccionar múltiples)
- Foto/Avatar
- Nombre completo
- Comunidad
- Parroquia
- Estado civil
- **¿Asiste?** (Toggle/Checkbox grande)
- **Observaciones** (Input texto o botón modal)
- **Necesidades especiales** (Dropdown)
- **Casa asignada** (Dropdown - se habilita solo si "asiste" es true)
- Acciones (Editar observaciones)

**Funcionalidades:**
- Filtros: Por parroquia, por comunidad, por estado de asistencia
- Búsqueda por nombre
- Selección masiva: "Marcar todos como asistentes"
- Botón: "Guardar cambios"
- Contador en tiempo real: "87 de 150 hermanos confirmados"

#### Tab 4: Casas de Convivencia
**Componente:** `CasasAssignment.astro`

**Parte A - Gestión de Casas:**
- Lista de casas asignadas a esta convivencia
- Tarjetas por casa:
  - Nombre de la casa
  - Capacidad total
  - Asignados: 35/40
  - Facilidades (planta baja, bebés)
  - Botón "Ver asignados"
  - Botón "Quitar de convivencia"
- Botón "Agregar casa a esta convivencia"

**Parte B - Asignación de Hermanos:**
- Modal o vista donde ves:
  - Lista de hermanos confirmados SIN casa asignada
  - Drag & drop o dropdown para asignar a casa
- O vista de cada casa con lista de asignados

#### Tab 5: Reportes (Opcional para después)
- Lista de asistencia para imprimir
- Por casa
- Por comunidad
- Resumen de necesidades especiales

### 3.4. Componentes Adicionales Necesarios

#### `ModalAddCasaConvivencia.astro`
Formulario para crear nueva casa de convivencia:
- Nombre
- Ubicación
- Capacidad
- ¿Tiene habitaciones en planta baja? (checkbox)
- ¿Tiene facilidades para bebés? (checkbox)
- Descripción

#### `ModalSelectCommunities.astro`
Para agregar comunidades a una convivencia existente:
- Igual que en creación
- Filtra las que ya están agregadas

#### `ModalEditAttendee.astro`
Para editar observaciones de un hermano:
- Nombre del hermano (readonly)
- ¿Asiste? (toggle)
- Necesidades especiales (dropdown)
- Observaciones (textarea)
- Casa asignada (dropdown)

#### `CasasConvivenciaManager.astro`
Página/sección para gestionar el catálogo de casas:
- CRUD completo de casas
- Lista todas las casas disponibles
- Historial de uso

---

## 📝 PASO 4: Flujo de Usuario Completo

### Escenario Ejemplo: Convivencia de 100 hermanos en 3 casas

#### Paso 4.1: Crear Convivencia
1. Usuario va a `/convivencias`
2. Click en "Nueva Convivencia"
3. Llena formulario:
   - Nombre: "Convivencia Paso 2 - Enero 2025"
   - Fecha inicio: 15/01/2025
   - Fecha fin: 17/01/2025
4. Selecciona comunidades:
   - Parroquia San Pedro → Comunidades 1, 2, 3 (45 hermanos)
   - Parroquia San Juan → Comunidades 1, 5 (38 hermanos)
   - Parroquia Santa María → Comunidades 2, 4, 6 (67 hermanos)
   - **Total elegibles: 150 hermanos**
5. Click "Crear Convivencia"
6. Redirige a `/convivencias/[id]`

#### Paso 4.2: Marcar Asistentes
1. En la página de la convivencia, va al Tab "Gestión de Asistentes"
2. Ve lista completa de 150 hermanos
3. Empieza a marcar quién SÍ va:
   - Juan Pérez → ✅ Asiste
   - María López → ✅ Asiste, Observación: "Tercera edad - planta baja"
   - Pedro Gómez → ❌ No asiste (no marca nada, se queda en false)
   - Ana Torres → ✅ Asiste, Necesidad: "Bebé"
4. Al final: 87 de 150 confirmados
5. Click "Guardar cambios"

#### Paso 4.3: Asignar Casas a la Convivencia
1. Va al Tab "Casas de Convivencia"
2. Click "Agregar casa a esta convivencia"
3. Selecciona:
   - Casa "Retiro San José" - Capacidad: 40
   - Casa "Monte Carmelo" - Capacidad: 35
   - Casa "Sagrada Familia" - Capacidad: 30
4. Total capacidad: 105 (suficiente para 87 confirmados)

#### Paso 4.4: Distribuir Hermanos en Casas
1. Opción A (Manual):
   - En la tabla de asistentes, columna "Casa asignada"
   - Selecciona casa para cada hermano
   - María López (tercera edad) → Casa "Retiro San José" (tiene planta baja)
   - Ana Torres (bebé) → Casa "Sagrada Familia" (tiene facilidades)

2. Opción B (Automática - implementar después):
   - Botón "Asignar automáticamente"
   - El sistema distribuye equitativamente
   - Respeta necesidades especiales

3. Resultado:
   - Casa San José: 32/40 hermanos
   - Casa Monte Carmelo: 30/35 hermanos
   - Casa Sagrada Familia: 25/30 hermanos

#### Paso 4.5: Ver Reportes
1. Va al Tab "Reportes"
2. Genera "Lista de asistencia - Casa San José"
3. Imprime PDF con los 32 hermanos de esa casa

---

## 🎯 PASO 5: Orden de Implementación Sugerido

### Sprint 1: Base de Datos y Catálogo de Casas
- [ ] Crear las 5 tablas en la BD
- [ ] Endpoint CRUD de `casas_convivencia`
- [ ] Página `/casas-convivencia` para gestionar catálogo
- [ ] Componente `ModalAddCasaConvivencia`

### Sprint 2: CRUD de Convivencias
- [ ] Endpoints básicos de convivencias (POST, GET, PUT, DELETE)
- [ ] Página `/convivencias` con lista
- [ ] Modal/Página para crear convivencia (solo info básica)
- [ ] Componente `ConvivenciasList`

### Sprint 3: Selección de Comunidades
- [ ] Endpoint para agregar comunidades a convivencia
- [ ] Componente de selección multi-parroquia
- [ ] Tab "Comunidades Participantes" en detalle de convivencia
- [ ] Endpoint `GET /api/convivencias/[id]/eligible-brothers`

### Sprint 4: Gestión de Asistentes (MÁS IMPORTANTE)
- [ ] Endpoint para marcar asistencia
- [ ] Tabla/Lista de hermanos elegibles
- [ ] Columnas: Asiste, Observaciones, Necesidades especiales
- [ ] Guardar cambios masivos
- [ ] Contador de confirmados vs elegibles

### Sprint 5: Asignación de Casas
- [ ] Endpoint para asignar casas a convivencia
- [ ] Tab "Casas de Convivencia"
- [ ] Endpoint para asignar hermanos a casas
- [ ] Dropdown/Select de casa en tabla de asistentes
- [ ] Vista de hermanos por casa

### Sprint 6: Reportes y Mejoras
- [ ] Generar PDF de listas de asistencia
- [ ] Asignación automática de casas
- [ ] Estadísticas avanzadas
- [ ] Historial de convivencias por hermano

---

## 📌 Consideraciones Importantes

### Validaciones Necesarias
1. **Capacidad de casas:** No asignar más hermanos de los que cabe
2. **Necesidades especiales:** Alertar si casa no tiene las facilidades requeridas
3. **Fechas:** Validar que fecha_fin > fecha_inicio
4. **Duplicados:** No permitir agregar misma comunidad dos veces
5. **Estado:** No permitir editar convivencias finalizadas

### Mejoras Futuras
1. **Confirmación por hermano:** Enviar notificación y que confirmen asistencia
2. **Pagos:** Tracking de cuotas de convivencia
3. **Grupos:** Dividir asistentes en grupos dentro de la casa
4. **Transporte:** Gestionar buses/vans para transporte
5. **Roles:** Algunos van como coordinadores, otros como participantes
6. **Check-in/Check-out:** Marcar llegada y salida real

---

## 🎨 Mockup de Flujo Visual

```
/convivencias
├─ [Botón] Nueva Convivencia
├─ Lista:
│  ├─ Tarjeta: Convivencia Enero 2025
│  │  ├─ Fechas: 15-17 Enero
│  │  ├─ Estado: Planificada
│  │  ├─ 87/150 hermanos confirmados
│  │  └─ [Ver] [Editar] [Eliminar]
│  └─ ...

/convivencias/[id]
├─ Tab: Información General
├─ Tab: Comunidades (8 comunidades, 150 hermanos elegibles)
├─ Tab: Gestión de Asistentes ⭐⭐⭐
│  ├─ Filtros: [Parroquia] [Comunidad] [Estado asistencia]
│  ├─ Tabla:
│  │  ├─ [✅] Juan Pérez | Com 2 | San Pedro | ☑️ Asiste | Ninguna | Casa San José
│  │  ├─ [✅] María López | Com 1 | San Juan | ☑️ Asiste | Tercera edad | Casa San José
│  │  ├─ [ ] Pedro Gómez | Com 3 | San Pedro | ☐ No asiste | - | -
│  │  └─ ...
│  └─ [Guardar cambios] (87 confirmados de 150)
├─ Tab: Casas (3 casas, 105 capacidad total)
│  ├─ Tarjeta: Casa San José (32/40)
│  ├─ Tarjeta: Casa Monte Carmelo (30/35)
│  └─ Tarjeta: Casa Sagrada Familia (25/30)
└─ Tab: Reportes
```

---

## ✅ Checklist Final

Antes de empezar a implementar, asegúrate de tener claro:

- [ ] Flujo completo de creación de convivencia
- [ ] Cómo se seleccionan comunidades de múltiples parroquias
- [ ] Cómo se marca asistencia y observaciones
- [ ] Cómo se asignan casas a la convivencia
- [ ] Cómo se asignan hermanos a casas específicas
- [ ] Estructura de base de datos con las 5 tablas
- [ ] Orden de implementación por sprints

---

## 🎯 Prioridad Máxima

**LO MÁS IMPORTANTE:**
1. **Tabla de Gestión de Asistentes** - Aquí se hace el 80% del trabajo
2. **Selección de comunidades** - Define quiénes son elegibles
3. **Asignación de casas** - Distribuir los confirmados

El resto (reportes, estadísticas, etc.) son nice-to-have que puedes agregar después.

---

¿Te parece bien este plan? ¿Necesitas que agregue o modifique algo antes de empezar a implementar?
