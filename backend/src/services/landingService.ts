import { PoolClient } from 'pg';
import { pool, withTenantTransaction } from '../utils/db';

export interface LandingSettingsInput {
  enabled: boolean;
  headline?: string;
  subheadline?: string;
  ctaLabel?: string;
}

export interface LandingPostInput {
  title: string;
  excerpt: string;
  content?: string;
  imageUrl?: string;
  status: 'draft' | 'published';
}

export interface LandingPricingInput {
  name: string;
  description?: string;
  priceLabel: string;
  billingPeriod?: string;
  features: string[];
  ctaLabel?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

const addAuditEvent = (
  client: PoolClient,
  tenantId: string,
  actorUserId: string,
  action: string,
  entityType: string,
  entityId?: string
) => client.query(
  `INSERT INTO audit_events
     (tenant_id, actor_user_id, action, entity_type, entity_id)
   VALUES ($1, $2, $3, $4, $5)`,
  [tenantId, actorUserId, action, entityType, entityId ?? null]
);

const getTenantBySlug = async (slug: string) => {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
  const result = await pool.query(
    `SELECT id, slug, nombre, logo_url, banner_url, primary_color,
            secondary_color, description, slogan, telefono, email,
            instagram_url, facebook_url, youtube_url, foundation_date,
            landing_enabled, landing_headline, landing_subheadline,
            landing_cta_label
     FROM tenants
     WHERE LOWER(slug) = LOWER($1)
       AND status = 'active' AND login_enabled = TRUE`,
    [slug]
  );
  return result.rows[0] ?? null;
};

export const getPublicLanding = async (slug: string) => {
  const tenant = await getTenantBySlug(slug);
  if (!tenant?.landing_enabled) return null;
  return withTenantTransaction(tenant.id, async (client) => {
    const [posts, pricing, events] = await Promise.all([
      client.query(
        `SELECT id, title, excerpt, content, image_url, published_at
         FROM landing_posts
         WHERE tenant_id = $1 AND status = 'published'
           AND published_at <= NOW()
         ORDER BY published_at DESC
         LIMIT 6`,
        [tenant.id]
      ),
      client.query(
        `SELECT id, name, description, price_label, billing_period,
                features, cta_label, is_featured
         FROM landing_pricing_plans
         WHERE tenant_id = $1 AND is_active = TRUE
         ORDER BY sort_order, created_at`,
        [tenant.id]
      ),
      client.query(
        `SELECT id, title, starts_at, location, type, team_name
         FROM (
           SELECT tr.id,
             COALESCE(NULLIF(tr.descripcion, ''), 'Entrenamiento') AS title,
             date_trunc('day', tr.fecha) + COALESCE(tr.hora_inicio, TIME '00:00') AS starts_at,
             tr.lugar AS location,
             'training'::TEXT AS type,
             t.nombre AS team_name
           FROM trainings tr
           LEFT JOIN teams t ON t.id = tr.equipo_id AND t.tenant_id = tr.tenant_id
           WHERE tr.tenant_id = $1 AND tr.fecha >= CURRENT_DATE
             AND tr.fecha <= CURRENT_DATE + 45
             AND COALESCE(tr.estado, 'programado') <> 'cancelado'
           UNION ALL
           SELECT m.id,
             CONCAT('Partido: ', COALESCE(home.nombre, 'Local'), ' vs ',
               COALESCE(away.nombre, 'Rival')) AS title,
             date_trunc('day', m.fecha) + COALESCE(m.kickoff_time, TIME '00:00') AS starts_at,
             m.lugar AS location,
             'match'::TEXT AS type,
             home.nombre AS team_name
           FROM matches m
           LEFT JOIN teams home
             ON home.id = m.equipo_local_id AND home.tenant_id = m.tenant_id
           LEFT JOIN teams away
             ON away.id = m.equipo_visitante_id AND away.tenant_id = m.tenant_id
           WHERE m.tenant_id = $1 AND m.fecha >= CURRENT_DATE
             AND m.fecha <= CURRENT_DATE + 45
             AND COALESCE(m.status, 'scheduled') IN ('scheduled', 'confirmed')
         ) public_events
         ORDER BY starts_at
         LIMIT 8`,
        [tenant.id]
      ),
    ]);
    return {
      tenant: {
        slug: tenant.slug,
        name: tenant.nombre,
        logoUrl: tenant.logo_url,
        bannerUrl: tenant.banner_url,
        primaryColor: tenant.primary_color,
        secondaryColor: tenant.secondary_color,
        description: tenant.description,
        slogan: tenant.slogan,
        phone: tenant.telefono,
        email: tenant.email,
        instagramUrl: tenant.instagram_url,
        facebookUrl: tenant.facebook_url,
        youtubeUrl: tenant.youtube_url,
        foundationDate: tenant.foundation_date,
        headline: tenant.landing_headline,
        subheadline: tenant.landing_subheadline,
        ctaLabel: tenant.landing_cta_label,
      },
      posts: posts.rows.map((post) => ({
        id: post.id,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        imageUrl: post.image_url,
        publishedAt: post.published_at,
      })),
      pricing: pricing.rows.map((plan) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        priceLabel: plan.price_label,
        billingPeriod: plan.billing_period,
        features: plan.features,
        ctaLabel: plan.cta_label,
        isFeatured: plan.is_featured,
      })),
      events: events.rows.map((event) => ({
        id: event.id,
        title: event.title,
        startsAt: event.starts_at,
        location: event.location,
        type: event.type,
        teamName: event.team_name,
      })),
    };
  });
};

export const getAdminLanding = async (tenantId: string) =>
  withTenantTransaction(tenantId, async (client) => {
    const [settings, posts, pricing] = await Promise.all([
      client.query(
        `SELECT landing_enabled, landing_headline, landing_subheadline,
                landing_cta_label, slug
         FROM tenants WHERE id = $1`,
        [tenantId]
      ),
      client.query(
        `SELECT id, title, excerpt, content, image_url, status, published_at,
                created_at, updated_at
         FROM landing_posts WHERE tenant_id = $1
         ORDER BY created_at DESC`,
        [tenantId]
      ),
      client.query(
        `SELECT id, name, description, price_label, billing_period, features,
                cta_label, is_featured, is_active, sort_order
         FROM landing_pricing_plans WHERE tenant_id = $1
         ORDER BY sort_order, created_at`,
        [tenantId]
      ),
    ]);
    return {
      settings: settings.rows[0],
      posts: posts.rows,
      pricing: pricing.rows,
    };
  });

export const updateSettings = async (
  tenantId: string,
  actorUserId: string,
  input: LandingSettingsInput
) => withTenantTransaction(tenantId, async (client) => {
  const result = await client.query(
    `UPDATE tenants
     SET landing_enabled = $1, landing_headline = $2,
         landing_subheadline = $3, landing_cta_label = $4
     WHERE id = $5
     RETURNING landing_enabled, landing_headline, landing_subheadline,
               landing_cta_label, slug`,
    [
      input.enabled,
      input.headline ?? null,
      input.subheadline ?? null,
      input.ctaLabel || 'Acceder a la academia',
      tenantId,
    ]
  );
  await addAuditEvent(
    client,
    tenantId,
    actorUserId,
    'landing.settings.update',
    'tenant',
    tenantId
  );
  return result.rows[0];
});

export const createPost = async (
  tenantId: string,
  actorUserId: string,
  input: LandingPostInput
) => withTenantTransaction(tenantId, async (client) => {
  const result = await client.query(
    `INSERT INTO landing_posts
       (tenant_id, title, excerpt, content, image_url, status,
        published_at, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,
       CASE WHEN $6 = 'published' THEN NOW() ELSE NULL END,$7)
     RETURNING *`,
    [
      tenantId,
      input.title,
      input.excerpt,
      input.content ?? null,
      input.imageUrl ?? null,
      input.status,
      actorUserId,
    ]
  );
  await addAuditEvent(
    client,
    tenantId,
    actorUserId,
    'landing.post.create',
    'landing_post',
    result.rows[0].id
  );
  return result.rows[0];
});

export const updatePost = async (
  tenantId: string,
  actorUserId: string,
  id: string,
  input: LandingPostInput
) => withTenantTransaction(tenantId, async (client) => {
  const result = await client.query(
    `UPDATE landing_posts
     SET title = $1, excerpt = $2, content = $3, image_url = $4,
         status = $5,
         published_at = CASE
           WHEN $5 = 'published' THEN COALESCE(published_at, NOW())
           ELSE NULL
         END,
         updated_at = NOW()
     WHERE id = $6 AND tenant_id = $7
     RETURNING *`,
    [
      input.title,
      input.excerpt,
      input.content ?? null,
      input.imageUrl ?? null,
      input.status,
      id,
      tenantId,
    ]
  );
  if (!result.rows[0]) throw new Error('Publicación no encontrada');
  await addAuditEvent(client, tenantId, actorUserId, 'landing.post.update', 'landing_post', id);
  return result.rows[0];
});

export const deletePost = async (
  tenantId: string,
  actorUserId: string,
  id: string
): Promise<void> => withTenantTransaction(tenantId, async (client) => {
  const result = await client.query(
    'DELETE FROM landing_posts WHERE id = $1 AND tenant_id = $2',
    [id, tenantId]
  );
  if (result.rowCount === 0) throw new Error('Publicación no encontrada');
  await addAuditEvent(client, tenantId, actorUserId, 'landing.post.delete', 'landing_post', id);
});

export const createPricing = async (
  tenantId: string,
  actorUserId: string,
  input: LandingPricingInput
) => withTenantTransaction(tenantId, async (client) => {
  const result = await client.query(
    `INSERT INTO landing_pricing_plans
       (tenant_id, name, description, price_label, billing_period, features,
        cta_label, is_featured, is_active, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      tenantId,
      input.name,
      input.description ?? null,
      input.priceLabel,
      input.billingPeriod ?? null,
      input.features,
      input.ctaLabel || 'Solicitar información',
      input.isFeatured ?? false,
      input.isActive ?? true,
      input.sortOrder ?? 0,
    ]
  );
  await addAuditEvent(
    client,
    tenantId,
    actorUserId,
    'landing.pricing.create',
    'landing_pricing',
    result.rows[0].id
  );
  return result.rows[0];
});

export const updatePricing = async (
  tenantId: string,
  actorUserId: string,
  id: string,
  input: LandingPricingInput
) => withTenantTransaction(tenantId, async (client) => {
  const result = await client.query(
    `UPDATE landing_pricing_plans
     SET name = $1, description = $2, price_label = $3, billing_period = $4,
         features = $5, cta_label = $6, is_featured = $7, is_active = $8,
         sort_order = $9, updated_at = NOW()
     WHERE id = $10 AND tenant_id = $11
     RETURNING *`,
    [
      input.name,
      input.description ?? null,
      input.priceLabel,
      input.billingPeriod ?? null,
      input.features,
      input.ctaLabel || 'Solicitar información',
      input.isFeatured ?? false,
      input.isActive ?? true,
      input.sortOrder ?? 0,
      id,
      tenantId,
    ]
  );
  if (!result.rows[0]) throw new Error('Plan no encontrado');
  await addAuditEvent(client, tenantId, actorUserId, 'landing.pricing.update', 'landing_pricing', id);
  return result.rows[0];
});

export const deletePricing = async (
  tenantId: string,
  actorUserId: string,
  id: string
): Promise<void> => withTenantTransaction(tenantId, async (client) => {
  const result = await client.query(
    'DELETE FROM landing_pricing_plans WHERE id = $1 AND tenant_id = $2',
    [id, tenantId]
  );
  if (result.rowCount === 0) throw new Error('Plan no encontrado');
  await addAuditEvent(
    client,
    tenantId,
    actorUserId,
    'landing.pricing.delete',
    'landing_pricing',
    id
  );
});
