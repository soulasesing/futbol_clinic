-- Agregar columnas nuevas a la tabla trainings
DO $$
BEGIN
    BEGIN
        ALTER TABLE trainings ADD COLUMN lugar VARCHAR(255) DEFAULT 'Campo principal';
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE trainings ADD COLUMN hora_inicio TIME;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE trainings ADD COLUMN hora_fin TIME;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE trainings ADD COLUMN dia_semana VARCHAR(20);
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE trainings ADD COLUMN es_recurrente BOOLEAN DEFAULT false;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE trainings ADD COLUMN color VARCHAR(7) DEFAULT '#22c55e';
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE trainings ADD COLUMN estado VARCHAR(20) DEFAULT 'programado';
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;

-- Crear índices si no existen
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'trainings' 
        AND indexname = 'idx_trainings_fecha'
    ) THEN
        CREATE INDEX idx_trainings_fecha ON trainings(fecha);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'trainings' 
        AND indexname = 'idx_trainings_equipo'
    ) THEN
        CREATE INDEX idx_trainings_equipo ON trainings(equipo_id);
    END IF;
END $$; 