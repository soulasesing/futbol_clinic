-- Agregar campos de teléfono para padres
ALTER TABLE players
  ADD COLUMN padre_telefono VARCHAR(50),
  ADD COLUMN madre_telefono VARCHAR(50); 