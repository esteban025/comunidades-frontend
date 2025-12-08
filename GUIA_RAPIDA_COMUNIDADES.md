# Guía Rápida: Gestión de Comunidades

## 🚀 Acceso Rápido

**URL:** `/communities`

**O desde la página principal:**
- Click en "Comunidades" en el navbar
- O click en el contador de comunidades en el resumen

---

## 📋 Funcionalidades Disponibles

### 1️⃣ Vista General
- Ver todas las parroquias con sus comunidades
- Contador de comunidades por parroquia
- Total de hermanos por comunidad
- Números y pasos de cada comunidad

### 2️⃣ Fusionar Comunidades

**¿Cuándo usar?**
- Dos o más comunidades se unen en una sola
- Ejemplo: Comunidad 2 y 3 se fusionan en la 2

**Pasos:**
1. Click en "Fusionar o Reorganizar Comunidades"
2. Selecciona la pestaña "Fusionar Comunidades"
3. Elige la parroquia
4. Selecciona la **comunidad destino** (la que se mantendrá)
5. Selecciona las **comunidades a fusionar** (se eliminarán)
6. Click en "Fusionar Comunidades"
7. Confirma la acción

**¿Qué sucede?**
- ✅ Todos los hermanos se transfieren a la comunidad destino
- ✅ Todos los roles se transfieren
- ✅ Los roles duplicados se eliminan automáticamente
- ✅ Las comunidades fuente se eliminan
- ✅ Los datos históricos se preservan

### 3️⃣ Reorganizar Números

**¿Cuándo usar?**
- Después de fusionar comunidades
- Para renumerar y mantener orden secuencial
- Ejemplo: Después de eliminar la 3, la 4 pasa a ser 3, la 5 pasa a ser 4

**Pasos:**
1. Click en "Fusionar o Reorganizar Comunidades"
2. Selecciona la pestaña "Reorganizar Números"
3. Elige la parroquia
4. Click en "Cargar Comunidades"
5. Modifica los números directamente en los campos
6. Click en "Aplicar Cambios"
7. Confirma la acción

**Validaciones:**
- ❌ No puede haber dos comunidades con el mismo número
- ✅ Los cambios se aplican en una sola transacción
- ✅ Si hay error, todo se revierte

---

## 💡 Ejemplo Completo

### Escenario: 
Una parroquia tiene 5 comunidades (1, 2, 3, 4, 5). Las comunidades 2 y 3 deciden fusionarse.

### Paso 1: Fusionar 2 y 3
```
ANTES:
Comunidad 1 - 15 hermanos
Comunidad 2 - 20 hermanos
Comunidad 3 - 18 hermanos
Comunidad 4 - 22 hermanos
Comunidad 5 - 25 hermanos

ACCIÓN:
- Comunidad destino: 2
- Comunidades a fusionar: 3

DESPUÉS:
Comunidad 1 - 15 hermanos
Comunidad 2 - 38 hermanos (20 + 18)
Comunidad 4 - 22 hermanos
Comunidad 5 - 25 hermanos
```

### Paso 2: Reorganizar números
```
ANTES:
Com. 1, Com. 2, Com. 4, Com. 5

CAMBIOS:
Com. 4 → Com. 3
Com. 5 → Com. 4

DESPUÉS:
Com. 1, Com. 2, Com. 3, Com. 4
```

---

## ⚠️ Consideraciones Importantes

### ✅ Seguro
- **Transacciones SQL**: Si algo falla, todo se revierte
- **Validaciones**: No permite números duplicados
- **Confirmaciones**: Siempre pide confirmación antes de aplicar

### ✅ Sin Pérdida de Datos
- **Hermanos**: Todos se transfieren correctamente
- **Roles**: Se preservan y consolidan
- **Historial**: Los IDs internos no cambian

### ⚠️ Precauciones
- **No reversible**: Una vez fusionado, no se puede deshacer
- **Números únicos**: No puede haber duplicados en la misma parroquia
- **Backup recomendado**: Haz respaldo antes de operaciones masivas

### 🔒 Restricciones
- No se puede fusionar una comunidad consigo misma
- Solo se pueden fusionar comunidades de la misma parroquia
- No se puede eliminar una comunidad con hermanos (debe fusionarse primero)

---

## 🎯 Mejores Prácticas

1. **Planifica antes de ejecutar**
   - Documenta qué comunidades se fusionarán
   - Define la nueva numeración

2. **Comunica a los responsables**
   - Informa a los líderes antes de hacer cambios
   - Explica el proceso y resultados

3. **Verifica después**
   - Revisa que los hermanos estén correctamente asignados
   - Confirma que los roles se transfirieron bien
   - Verifica la nueva numeración

4. **Usa la reorganización gradualmente**
   - No cambies todos los números a la vez
   - Hazlo por parroquia si hay muchas comunidades

---

## 🛠️ Solución de Problemas

### "Ya existe una comunidad con ese número"
**Causa:** Intentas asignar un número que ya está en uso
**Solución:** Elige otro número o primero reorganiza las demás

### "No se puede eliminar la comunidad porque tiene hermanos"
**Causa:** Intentas eliminar directamente una comunidad con hermanos
**Solución:** Usa "Fusionar" en lugar de eliminar

### "No se puede fusionar una comunidad consigo misma"
**Causa:** Seleccionaste la misma comunidad como destino y fuente
**Solución:** Verifica que sean comunidades diferentes

---

## 📞 Soporte

Si necesitas ayuda adicional o tienes preguntas sobre casos especiales, consulta la documentación completa en `GESTION_COMUNIDADES.md`
