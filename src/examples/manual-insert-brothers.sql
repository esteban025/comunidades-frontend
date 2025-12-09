-- Script de ejemplo para crear datos manualmente
-- Crea 2 comunidades en una parroquia y 1 comunidad en otra parroquia
-- Luego inserta un hermano siguiendo la lógica actual del endpoint POST /api/brothers

USE comunidades_db;

-- 1) Parroquias de ejemplo
INSERT INTO parishes (name, tag, aka) VALUES
  ('Parroquia San Pedro', 'san_pedro', 'San Pedro'),
  ('Parroquia San Juan', 'san_juan', 'San Juan');

-- Tomar los IDs generados (ajusta si ya tienes parroquias existentes)
-- Supongamos que quedaron así:
-- San Pedro -> id = 1
-- San Juan  -> id = 2

-- 2) Comunidades de ejemplo
-- En San Pedro (parish_id = 1) creamos 2 comunidades: 1 y 2
INSERT INTO communities (parish_id, number_community, level_paso) VALUES
  (1, 1, 'Paso 1'),
  (1, 2, 'Paso 2');

-- En San Juan (parish_id = 2) creamos 1 comunidad: 1
INSERT INTO communities (parish_id, number_community, level_paso) VALUES
  (2, 1, 'Paso 1');

-- Supongamos que los IDs de communities quedaron así:
-- San Pedro, comunidad 1 -> id = 1
-- San Pedro, comunidad 2 -> id = 2
-- San Juan, comunidad 1  -> id = 3

-- 3) Insertar 10 hermanos por comunidad (3 comunidades -> 30 hermanos)
-- Lógica equivalente al endpoint (sin roles ni validaciones adicionales)

INSERT INTO brothers (names, civil_status, community_id, phone) VALUES
  -- Comunidad 1 - San Pedro (community_id = 1)
  ('Juan Pérez', 'soltero', 1, NULL),
  ('María López', 'soltera', 1, NULL),
  ('Carlos Gómez', 'soltero', 1, NULL),
  ('Ana Torres', 'soltera', 1, NULL),
  ('Pedro Ramírez', 'soltero', 1, NULL),
  ('Lucía Fernández', 'soltera', 1, NULL),
  ('Miguel Sánchez', 'soltero', 1, NULL),
  ('Laura Díaz', 'soltera', 1, NULL),
  ('Andrés Castillo', 'soltero', 1, NULL),
  ('Elena Rojas', 'soltera', 1, NULL),

  -- Comunidad 2 - San Pedro (community_id = 2)
  ('José Martínez', 'soltero', 2, NULL),
  ('Patricia Núñez', 'soltera', 2, NULL),
  ('Raúl Herrera', 'soltero', 2, NULL),
  ('Claudia Vega', 'soltera', 2, NULL),
  ('Fernando Ortiz', 'soltero', 2, NULL),
  ('Sofía Morales', 'soltera', 2, NULL),
  ('Jorge Castro', 'soltero', 2, NULL),
  ('Isabel León', 'soltera', 2, NULL),
  ('Diego Paredes', 'soltero', 2, NULL),
  ('Carmen Ruiz', 'soltera', 2, NULL),

  -- Comunidad 1 - San Juan (community_id = 3)
  ('Luis Gutiérrez', 'soltero', 3, NULL),
  ('Teresa Campos', 'soltera', 3, NULL),
  ('Ricardo Arias', 'soltero', 3, NULL),
  ('Verónica Molina', 'soltera', 3, NULL),
  ('Héctor Domínguez', 'soltero', 3, NULL),
  ('Paula Navarro', 'soltera', 3, NULL),
  ('Sergio Cuenca', 'soltero', 3, NULL),
  ('Natalia Fuentes', 'soltera', 3, NULL),
  ('Adrián Silva', 'soltero', 3, NULL),
  ('Rosa Cabrera', 'soltera', 3, NULL);

-- Ajusta los IDs de parroquias y comunidades según los valores reales de tu base de datos
