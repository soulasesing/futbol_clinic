-- Initial editable public content for the authorized Pachuca academy tenant.
-- Rollback: remove rows created for this tenant and disable its landing page.

UPDATE tenants
SET landing_enabled = TRUE,
    landing_headline = 'Formamos futbolistas con identidad, disciplina y pasión',
    landing_subheadline = 'Un proyecto de formación integral para desarrollar talento dentro y fuera de la cancha.',
    landing_cta_label = 'Acceder al portal'
WHERE slug = 'pachuca-futbol-club';

INSERT INTO landing_posts
  (tenant_id, title, excerpt, content, status, published_at)
SELECT t.id,
       'Bienvenidos a nuestra academia',
       'Conoce el espacio donde jugadores, familias y entrenadores crecen como una sola comunidad.',
       'Desde esta portada compartiremos convocatorias, próximos eventos y noticias importantes de la academia.',
       'published',
       NOW()
FROM tenants t
WHERE t.slug = 'pachuca-futbol-club'
  AND NOT EXISTS (
    SELECT 1 FROM landing_posts lp
    WHERE lp.tenant_id = t.id AND lp.title = 'Bienvenidos a nuestra academia'
  );

INSERT INTO landing_pricing_plans
  (tenant_id, name, description, price_label, billing_period, features,
   cta_label, is_featured, sort_order)
SELECT t.id,
       'Programa de formación',
       'Entrenamiento progresivo de acuerdo con la edad y etapa deportiva.',
       'Precio a consultar',
       'según categoría',
       ARRAY['Entrenamientos planificados', 'Acompañamiento de entrenadores', 'Acceso al portal familiar'],
       'Solicitar información',
       TRUE,
       1
FROM tenants t
WHERE t.slug = 'pachuca-futbol-club'
  AND NOT EXISTS (
    SELECT 1 FROM landing_pricing_plans lpp
    WHERE lpp.tenant_id = t.id AND lpp.name = 'Programa de formación'
  );
