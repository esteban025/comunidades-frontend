DROP DATABASE IF EXISTS comunidades_db;
CREATE DATABASE comunidades_db;
USE comunidades_db;

-- TABLA PARROQUIAS
CREATE TABLE parishes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  tag VARCHAR(50) NOT NULL,
  aka VARCHAR(100) NOT NULL
);

-- TABLA COMUNIDADES
CREATE TABLE communities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  number_community INT NOT NULL,
  parish_id INT NOT NULL,
  level_paso VARCHAR(100) DEFAULT NULL,
  FOREIGN KEY (parish_id) REFERENCES parishes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_community_per_parish (parish_id, number_community)
);

-- TABLA HERMANOS (incluye todos los hermanos y catequistas)
CREATE TABLE brothers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  names VARCHAR(200) NOT NULL,
  civil_status ENUM('matrimonio', 'soltero', 'soltera') NOT NULL,
  community_id INT NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
  UNIQUE KEY unique_name_per_community (names, community_id)
);

-- TABLA ROLES DE HERMANOS EN COMUNIDADES
-- Un hermano puede tener múltiples roles en diferentes comunidades
-- Ejemplo: Responsable de su comunidad Y catequista de otras
CREATE TABLE brother_roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  brother_id INT NOT NULL,
  community_id INT NOT NULL,
  role ENUM('responsable', 'corresponsable', 'didascala', 'ostiario', 'catequista') NOT NULL,
  FOREIGN KEY (brother_id) REFERENCES brothers(id) ON DELETE CASCADE,
  FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
  UNIQUE KEY unique_brother_role_per_community (brother_id, community_id, role)
);

-- VISTA: GRUPO ENCARGADO (solo responsables y corresponsables)
CREATE VIEW group_leaders AS
SELECT 
  br.id,
  br.names,
  br.civil_status,
  br.phone,
  br.community_id,
  c.number_community,
  p.name AS parish_name,
  brol.role
FROM brothers br
INNER JOIN brother_roles brol ON br.id = brol.brother_id
INNER JOIN communities c ON br.community_id = c.id
INNER JOIN parishes p ON c.parish_id = p.id
WHERE brol.role IN ('responsable', 'corresponsable');

-- VISTA: CATEQUISTAS POR COMUNIDAD
CREATE VIEW catechists_by_community AS
SELECT 
  br.id AS brother_id,
  br.names AS catechist_name,
  br.civil_status,
  br.phone,
  br.community_id AS own_community_id,
  brol.community_id AS serves_community_id,
  c.number_community,
  p.name AS parish_name
FROM brothers br
INNER JOIN brother_roles brol ON br.id = brol.brother_id
INNER JOIN communities c ON brol.community_id = c.id
INNER JOIN parishes p ON c.parish_id = p.id
WHERE brol.role = 'catequista';

-- ORGANIZACION PARA CASA DE CONVIVENCIAS
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
CREATE TABLE convivencia_communities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  convivencia_id INT NOT NULL,
  community_id INT NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (convivencia_id) REFERENCES convivencias(id) ON DELETE CASCADE,
  FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
  UNIQUE KEY unique_community_convivencia (convivencia_id, community_id)
);
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
CREATE TABLE convivencia_casas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  convivencia_id INT NOT NULL,
  casa_id INT NOT NULL,
  capacity_assigned INT,  -- Cuántos hermanos se asignarán a esta casa
  FOREIGN KEY (convivencia_id) REFERENCES convivencias(id) ON DELETE CASCADE,
  FOREIGN KEY (casa_id) REFERENCES casas_convivencia(id) ON DELETE CASCADE,
  UNIQUE KEY unique_casa_convivencia (convivencia_id, casa_id)
);
CREATE TABLE convivencia_invited (
  id INT AUTO_INCREMENT PRIMARY KEY,
  convivencia_id INT NOT NULL,
  brother_id INT NOT NULL,
  invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (convivencia_id) REFERENCES convivencias(id) ON DELETE CASCADE,
  FOREIGN KEY (brother_id) REFERENCES brothers(id) ON DELETE CASCADE,
  UNIQUE KEY unique_invited (convivencia_id, brother_id)
);
CREATE TABLE convivencia_attendees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  convivencia_id INT NOT NULL,
  brother_id INT NOT NULL,
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