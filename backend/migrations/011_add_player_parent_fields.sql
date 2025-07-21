-- Agregar campos de inscripción de padres y correo del jugador a players
ALTER TABLE players
  ADD COLUMN correo_jugador VARCHAR(255),
  ADD COLUMN padre_nombre VARCHAR(100),
  ADD COLUMN padre_apellido VARCHAR(100),
  ADD COLUMN padre_email VARCHAR(255),
  ADD COLUMN madre_nombre VARCHAR(100),
  ADD COLUMN madre_apellido VARCHAR(100),
  ADD COLUMN madre_email VARCHAR(255); 