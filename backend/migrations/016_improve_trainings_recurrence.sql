-- Eliminar columnas antiguas de recurrencia
ALTER TABLE trainings DROP COLUMN IF EXISTS recurrence_type;
ALTER TABLE trainings DROP COLUMN IF EXISTS recurrence_days;
ALTER TABLE trainings DROP COLUMN IF EXISTS recurrence_end_date;
ALTER TABLE trainings DROP COLUMN IF EXISTS recurrence_interval;
ALTER TABLE trainings DROP COLUMN IF EXISTS is_template;
ALTER TABLE trainings DROP COLUMN IF EXISTS template_id;
ALTER TABLE trainings DROP COLUMN IF EXISTS instance_date;
ALTER TABLE trainings DROP COLUMN IF EXISTS is_cancelled;

-- Agregar columnas simplificadas
ALTER TABLE trainings ADD COLUMN IF NOT EXISTS dia_semana VARCHAR(20);
ALTER TABLE trainings ADD COLUMN IF NOT EXISTS fecha_fin DATE;

-- Actualizar entrenamientos existentes
UPDATE trainings 
SET es_recurrente = false 
WHERE es_recurrente IS NULL; 