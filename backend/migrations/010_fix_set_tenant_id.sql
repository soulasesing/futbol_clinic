-- Actualizar función set_tenant_id para soportar super_admin (tenant_id NULL)
CREATE OR REPLACE FUNCTION set_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    BEGIN
      NEW.tenant_id := current_setting('app.current_tenant')::uuid;
    EXCEPTION
      WHEN others THEN
        -- Si la variable no existe, deja tenant_id en NULL (caso super_admin)
        NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql; 