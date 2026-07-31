import { PoolClient, QueryResult, QueryResultRow } from 'pg';
import { pool, setLocalTenantContext, withTenantTransaction } from '../utils/db';
import { Actor, guardianOwnsHousehold, isAdmin } from './domainService';

export interface PaymentInput {
  [key: string]: unknown;
}

const toApi = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(toApi);
  if (!value || typeof value !== 'object' || value instanceof Date) return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase()),
      toApi(entry),
    ])
  );
};

const assertAdmin = (actor: Actor): void => {
  if (!isAdmin(actor)) throw new Error('FORBIDDEN: Se requiere rol administrador');
};

const tenantQuery = async <T extends QueryResultRow = QueryResultRow>(
  tenantId: string,
  text: string,
  values: unknown[] = []
): Promise<QueryResult<T>> =>
  withTenantTransaction(tenantId, (client) => client.query<T>(text, values));

const audit = async (
  client: PoolClient,
  actor: Actor,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {}
): Promise<void> => {
  await client.query(
    `INSERT INTO audit_events
       (tenant_id, actor_user_id, action, entity_type, entity_id, metadata)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb)`,
    [actor.tenantId, actor.userId, action, entityType, entityId, JSON.stringify(metadata)]
  );
};

export const listPaymentAccounts = async (actor: Actor): Promise<unknown[]> => {
  if (!isAdmin(actor) && actor.role !== 'parent') {
    throw new Error('FORBIDDEN: Sin acceso a cuentas de pago');
  }
  const result = await tenantQuery(actor.tenantId,
    `SELECT id, name, account_type, instructions, bank_name, account_holder,
            account_number, wallet_identifier, qr_url, currency
     FROM payment_accounts
     WHERE tenant_id = $1 AND is_active = TRUE
     ORDER BY display_order, name`,
    [actor.tenantId]
  );
  return toApi(result.rows) as unknown[];
};

export const savePaymentAccount = async (
  actor: Actor,
  input: PaymentInput
): Promise<unknown> => {
  assertAdmin(actor);
  const id = input.id ?? null;
  const result = await tenantQuery(actor.tenantId,
    `INSERT INTO payment_accounts
       (id, tenant_id, name, account_type, instructions, bank_name, account_holder,
        account_number, wallet_identifier, qr_url, currency, is_active, display_order)
     VALUES (COALESCE($1::uuid, gen_random_uuid()),$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       account_type = EXCLUDED.account_type,
       instructions = EXCLUDED.instructions,
       bank_name = EXCLUDED.bank_name,
       account_holder = EXCLUDED.account_holder,
       account_number = EXCLUDED.account_number,
       wallet_identifier = EXCLUDED.wallet_identifier,
       qr_url = EXCLUDED.qr_url,
       currency = EXCLUDED.currency,
       is_active = EXCLUDED.is_active,
       display_order = EXCLUDED.display_order,
       updated_at = NOW()
     WHERE payment_accounts.tenant_id = EXCLUDED.tenant_id
     RETURNING *`,
    [
      id,
      actor.tenantId,
      input.name,
      input.accountType,
      input.instructions,
      input.bankName ?? null,
      input.accountHolder ?? null,
      input.accountNumber ?? null,
      input.walletIdentifier ?? null,
      input.qrUrl ?? null,
      input.currency ?? 'USD',
      input.isActive ?? true,
      input.displayOrder ?? 0,
    ]
  );
  if (!result.rows[0]) throw new Error('NOT_FOUND: Cuenta de pago no encontrada');
  return toApi(result.rows[0]);
};

export const createFeeConcept = async (
  actor: Actor,
  input: PaymentInput
): Promise<unknown> => {
  assertAdmin(actor);
  const result = await tenantQuery(actor.tenantId,
    `INSERT INTO fee_concepts
       (tenant_id, name, description, default_amount_cents, currency)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [
      actor.tenantId,
      input.name,
      input.description ?? null,
      input.defaultAmountCents ?? null,
      input.currency ?? 'USD',
    ]
  );
  return toApi(result.rows[0]);
};

export const listFeeConcepts = async (actor: Actor): Promise<unknown[]> => {
  const result = await tenantQuery(actor.tenantId,
    `SELECT * FROM fee_concepts
     WHERE tenant_id = $1 AND is_active = TRUE ORDER BY name`,
    [actor.tenantId]
  );
  return toApi(result.rows) as unknown[];
};

export const createCharge = async (
  actor: Actor,
  input: PaymentInput
): Promise<unknown> => {
  assertAdmin(actor);
  const items = input.items as PaymentInput[];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await setLocalTenantContext(client, actor.tenantId);
    const householdCheck = await client.query(
      `SELECT 1 FROM households WHERE id = $1 AND tenant_id = $2`,
      [input.householdId, actor.tenantId]
    );
    if (!householdCheck.rows[0]) throw new Error('NOT_FOUND: Hogar no encontrado');
    if (input.playerId) {
      const playerCheck = await client.query(
        `SELECT 1 FROM players p
         JOIN guardian_players gp
           ON gp.player_id = p.id AND gp.tenant_id = p.tenant_id
         JOIN guardians g
           ON g.id = gp.guardian_id AND g.tenant_id = gp.tenant_id
         WHERE p.id = $1 AND p.tenant_id = $2 AND g.household_id = $3`,
        [input.playerId, actor.tenantId, input.householdId]
      );
      if (!playerCheck.rows[0]) {
        throw new Error('NOT_FOUND: El jugador no pertenece al hogar');
      }
    }
    if (input.seasonId) {
      const seasonCheck = await client.query(
        `SELECT 1 FROM seasons WHERE id = $1 AND tenant_id = $2`,
        [input.seasonId, actor.tenantId]
      );
      if (!seasonCheck.rows[0]) throw new Error('NOT_FOUND: Temporada no encontrada');
    }
    const totalCents = items.reduce(
      (sum, item) => sum + Number(item.quantity ?? 1) * Number(item.unitAmountCents),
      0
    );
    const chargeResult = await client.query(
      `INSERT INTO charges
         (tenant_id, household_id, player_id, season_id, description,
          currency, total_cents, due_on, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        actor.tenantId,
        input.householdId,
        input.playerId ?? null,
        input.seasonId ?? null,
        input.description,
        input.currency ?? 'USD',
        totalCents,
        input.dueOn ?? null,
        actor.userId,
      ]
    );
    const charge = chargeResult.rows[0];
    const createdItems: unknown[] = [];
    for (const item of items) {
      if (item.feeConceptId) {
        const conceptCheck = await client.query(
          `SELECT 1 FROM fee_concepts WHERE id = $1 AND tenant_id = $2`,
          [item.feeConceptId, actor.tenantId]
        );
        if (!conceptCheck.rows[0]) {
          throw new Error('NOT_FOUND: Concepto de cobro no encontrado');
        }
      }
      const itemResult = await client.query(
        `INSERT INTO charge_items
           (tenant_id, charge_id, fee_concept_id, description, quantity, unit_amount_cents)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [
          actor.tenantId,
          charge.id,
          item.feeConceptId ?? null,
          item.description,
          item.quantity ?? 1,
          item.unitAmountCents,
        ]
      );
      createdItems.push(itemResult.rows[0]);
    }
    await audit(client, actor, 'charge.created', 'charge', charge.id, { totalCents });
    await client.query('COMMIT');
    return toApi({ ...charge, items: createdItems });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export interface PaymentUploadContext {
  chargeId: string;
  householdId: string;
  currency: string;
  balanceCents: number;
  channel: string;
}

export const getPaymentUploadContext = async (
  actor: Actor,
  chargeId: string,
  paymentAccountId: string
): Promise<PaymentUploadContext> => {
  if (actor.role !== 'parent' && !isAdmin(actor)) {
    throw new Error('FORBIDDEN: Solo familias o administradores pueden enviar pagos');
  }
  const chargeResult = await tenantQuery(actor.tenantId,
    `SELECT c.*, account.account_type,
       c.total_cents - COALESCE((
         SELECT SUM(allocation.amount_cents)
         FROM payment_allocations allocation
         WHERE allocation.charge_id = c.id AND allocation.tenant_id = c.tenant_id
       ), 0) AS balance_cents
     FROM charges c
     JOIN payment_accounts account
       ON account.id = $3 AND account.tenant_id = c.tenant_id
      AND account.is_active = TRUE
     WHERE c.id = $1 AND c.tenant_id = $2
       AND c.status IN ('open', 'partially_paid')`,
    [chargeId, actor.tenantId, paymentAccountId]
  );
  const charge = chargeResult.rows[0];
  if (!charge) throw new Error('NOT_FOUND: Cargo o cuenta de pago no encontrado');
  if (!(await guardianOwnsHousehold(actor, charge.household_id, 'submit'))) {
    throw new Error('FORBIDDEN: Sin permiso para pagar este hogar');
  }
  const expectedChannel: Record<string, string> = {
    bank: 'bank_transfer',
    wallet: 'wallet',
    cash: 'cash',
  };
  return {
    chargeId: String(charge.id),
    householdId: String(charge.household_id),
    currency: String(charge.currency),
    balanceCents: Number(charge.balance_cents),
    channel: expectedChannel[String(charge.account_type)] || 'other',
  };
};

export const findSubmissionByIdempotency = async (
  actor: Actor,
  idempotencyKey: string
): Promise<unknown> => {
  const result = await tenantQuery(actor.tenantId,
    `SELECT id, charge_id, payment_account_id, amount_cents, currency, channel,
            proof_filename, proof_mime_type, proof_size_bytes, status, submitted_at
     FROM payment_submissions
     WHERE tenant_id = $1 AND submitted_by = $2 AND idempotency_key = $3`,
    [actor.tenantId, actor.userId, idempotencyKey]
  );
  return result.rows[0] ? toApi(result.rows[0]) : null;
};

export const submitManualPayment = async (
  actor: Actor,
  input: PaymentInput
): Promise<unknown> => {
  if (typeof input.chargeId !== 'string' || typeof input.paymentAccountId !== 'string') {
    throw new TypeError('VALIDATION: chargeId y paymentAccountId son obligatorios');
  }
  const context = await getPaymentUploadContext(
    actor,
    input.chargeId,
    input.paymentAccountId
  );
  if (context.currency !== input.currency) {
    throw new Error('VALIDATION: La moneda no coincide con el cargo');
  }
  if (context.channel !== input.channel) {
    throw new Error('VALIDATION: El canal no coincide con la cuenta de pago');
  }
  if (Number(input.amountCents) > context.balanceCents) {
    throw new Error('VALIDATION: El monto excede el saldo del cargo');
  }
  const result = await tenantQuery(actor.tenantId,
    `INSERT INTO payment_submissions
       (tenant_id, household_id, charge_id, submitted_by, payment_account_id,
        amount_cents, currency, provider, channel, external_reference,
        proof_storage_key, proof_filename, proof_mime_type, proof_size_bytes,
        payer_note, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     ON CONFLICT (tenant_id, submitted_by, idempotency_key)
     DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
     RETURNING *`,
    [
      actor.tenantId,
      context.householdId,
      context.chargeId,
      actor.userId,
      input.paymentAccountId ?? null,
      input.amountCents,
      input.currency,
      input.provider ?? 'manual',
      input.channel,
      input.externalReference ?? null,
      input.proofStorageKey,
      input.proofFilename ?? null,
      input.proofMimeType ?? null,
      input.proofSizeBytes ?? null,
      input.payerNote ?? null,
      input.idempotencyKey,
    ]
  );
  return toApi(result.rows[0]);
};

export const listSubmissions = async (
  actor: Actor,
  status?: 'pending' | 'approved' | 'rejected'
): Promise<unknown[]> => {
  if (!isAdmin(actor) && actor.role !== 'parent') {
    throw new Error('FORBIDDEN: Sin acceso a comprobantes');
  }
  const result = await tenantQuery(actor.tenantId,
    `SELECT ps.id, ps.household_id, ps.charge_id, ps.submitted_by,
            ps.payment_account_id, ps.amount_cents, ps.currency, ps.provider,
            ps.channel, ps.external_reference, ps.proof_filename,
            ps.proof_mime_type, ps.proof_size_bytes, ps.payer_note, ps.status,
            ps.reviewed_by, ps.reviewed_at, ps.review_note, ps.submitted_at,
            h.name AS family_name, c.description
     FROM payment_submissions ps
     JOIN households h ON h.id = ps.household_id AND h.tenant_id = ps.tenant_id
     JOIN charges c ON c.id = ps.charge_id AND c.tenant_id = ps.tenant_id
     WHERE ps.tenant_id = $1
       AND ($4::text IS NULL OR ps.status = $4)
       AND (
         $2::boolean
         OR EXISTS (
           SELECT 1 FROM guardians g
           JOIN guardian_players gp
             ON gp.guardian_id = g.id AND gp.tenant_id = g.tenant_id
           WHERE g.tenant_id = ps.tenant_id
             AND g.household_id = ps.household_id
             AND g.user_id = $3
             AND gp.can_view_finances = TRUE
         )
       )
     ORDER BY ps.submitted_at DESC`,
    [actor.tenantId, isAdmin(actor), actor.userId, status ?? null]
  );
  return toApi(result.rows) as unknown[];
};

export const listCharges = async (actor: Actor): Promise<unknown[]> => {
  if (!isAdmin(actor) && actor.role !== 'parent') {
    throw new Error('FORBIDDEN: Sin acceso a cargos');
  }
  const result = await tenantQuery(actor.tenantId,
    `SELECT c.*, h.name AS family_name,
       concat_ws(' ', p.nombre, p.apellido) AS player_name,
       COALESCE(SUM(pa.amount_cents), 0) AS allocated_cents,
       c.total_cents - COALESCE(SUM(pa.amount_cents), 0) AS balance_cents
     FROM charges c
     JOIN households h ON h.id = c.household_id AND h.tenant_id = c.tenant_id
     LEFT JOIN players p ON p.id = c.player_id AND p.tenant_id = c.tenant_id
     LEFT JOIN payment_allocations pa
       ON pa.charge_id = c.id AND pa.tenant_id = c.tenant_id
     WHERE c.tenant_id = $1
       AND (
         $2::boolean
         OR EXISTS (
           SELECT 1 FROM guardians g
           JOIN guardian_players gp
             ON gp.guardian_id = g.id AND gp.tenant_id = g.tenant_id
           WHERE g.tenant_id = c.tenant_id
             AND g.household_id = c.household_id
             AND g.user_id = $3
             AND gp.can_view_finances = TRUE
         )
       )
     GROUP BY c.id, h.name, p.nombre, p.apellido
     ORDER BY c.due_on NULLS LAST, c.created_at DESC`,
    [actor.tenantId, isAdmin(actor), actor.userId]
  );
  return toApi(result.rows) as unknown[];
};

export const listReceipts = async (actor: Actor): Promise<unknown[]> => {
  if (!isAdmin(actor) && actor.role !== 'parent') {
    throw new Error('FORBIDDEN: Sin acceso a recibos');
  }
  const result = await tenantQuery(actor.tenantId,
    `SELECT r.id, r.receipt_number, r.issued_at, r.snapshot,
            p.amount_cents, p.currency, p.household_id,
            h.name AS family_name
     FROM payment_receipts r
     JOIN payments p ON p.id = r.payment_id AND p.tenant_id = r.tenant_id
     JOIN households h ON h.id = p.household_id AND h.tenant_id = p.tenant_id
     WHERE r.tenant_id = $1
       AND (
         $2::boolean
         OR EXISTS (
           SELECT 1 FROM guardians g
           JOIN guardian_players gp
             ON gp.guardian_id = g.id AND gp.tenant_id = g.tenant_id
           WHERE g.tenant_id = p.tenant_id
             AND g.household_id = p.household_id
             AND g.user_id = $3
             AND gp.can_view_finances = TRUE
         )
       )
     ORDER BY r.issued_at DESC`,
    [actor.tenantId, isAdmin(actor), actor.userId]
  );
  return toApi(result.rows) as unknown[];
};

export const getPortfolio = async (actor: Actor): Promise<unknown[]> => {
  assertAdmin(actor);
  const result = await tenantQuery(actor.tenantId,
    `SELECT h.id, h.name AS family_name,
       COALESCE(SUM(c.total_cents), 0) AS charged_cents,
       COALESCE(SUM(alloc.allocated_cents), 0) AS paid_cents,
       COALESCE(SUM(c.total_cents - COALESCE(alloc.allocated_cents, 0)), 0)
         AS balance_cents,
       COALESCE(SUM(
         CASE WHEN c.due_on < CURRENT_DATE AND c.status IN ('open', 'partially_paid')
           THEN c.total_cents - COALESCE(alloc.allocated_cents, 0)
           ELSE 0 END
       ), 0) AS overdue_cents
     FROM households h
     LEFT JOIN charges c
       ON c.household_id = h.id AND c.tenant_id = h.tenant_id AND c.status <> 'void'
     LEFT JOIN (
       SELECT charge_id, tenant_id, SUM(amount_cents) AS allocated_cents
       FROM payment_allocations
       WHERE tenant_id = $1
       GROUP BY charge_id, tenant_id
     ) alloc ON alloc.charge_id = c.id AND alloc.tenant_id = c.tenant_id
     WHERE h.tenant_id = $1
     GROUP BY h.id, h.name
     HAVING COALESCE(SUM(c.total_cents - COALESCE(alloc.allocated_cents, 0)), 0) > 0
     ORDER BY overdue_cents DESC, balance_cents DESC, h.name`,
    [actor.tenantId]
  );
  return toApi(result.rows) as unknown[];
};

export interface PrivateProof {
  pathname: string;
  filename: string;
  mimeType: string;
  sizeBytes?: number;
}

export const getProofForDownload = async (
  actor: Actor,
  submissionId: string
): Promise<PrivateProof> => {
  assertAdmin(actor);
  const result = await tenantQuery(actor.tenantId,
    `SELECT proof_storage_key, proof_filename, proof_mime_type, proof_size_bytes
     FROM payment_submissions
     WHERE id = $1 AND tenant_id = $2`,
    [submissionId, actor.tenantId]
  );
  const proof = result.rows[0];
  if (!proof) throw new Error('NOT_FOUND: Comprobante no encontrado');
  return {
    pathname: String(proof.proof_storage_key),
    filename: String(proof.proof_filename || 'comprobante'),
    mimeType: String(proof.proof_mime_type || 'application/octet-stream'),
    sizeBytes: proof.proof_size_bytes == null ? undefined : Number(proof.proof_size_bytes),
  };
};

const existingApproval = async (
  client: PoolClient,
  tenantId: string,
  submissionId: string
): Promise<unknown> => {
  const result = await client.query(
    `SELECT p.*, r.id AS receipt_id, r.receipt_number
     FROM payments p
     JOIN payment_receipts r ON r.payment_id = p.id AND r.tenant_id = p.tenant_id
     WHERE p.tenant_id = $1 AND p.submission_id = $2`,
    [tenantId, submissionId]
  );
  return result.rows[0];
};

export const reviewSubmission = async (
  actor: Actor,
  submissionId: string,
  decision: 'approved' | 'rejected',
  reviewNote?: string
): Promise<unknown> => {
  assertAdmin(actor);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await setLocalTenantContext(client, actor.tenantId);
    const submissionResult = await client.query(
      `SELECT * FROM payment_submissions
       WHERE id = $1 AND tenant_id = $2 FOR UPDATE`,
      [submissionId, actor.tenantId]
    );
    const submission = submissionResult.rows[0];
    if (!submission) throw new Error('NOT_FOUND: Envío no encontrado');
    if (submission.status === 'approved') {
      const existing = await existingApproval(client, actor.tenantId, submissionId);
      await client.query('COMMIT');
      return toApi(existing);
    }
    if (submission.status === 'rejected') {
      if (decision === 'rejected') {
        await client.query('COMMIT');
        return toApi(submission);
      }
      throw new Error('CONFLICT: Un envío rechazado no se puede aprobar');
    }
    if (decision === 'rejected') {
      const rejected = await client.query(
        `UPDATE payment_submissions SET
           status = 'rejected', reviewed_by = $3, reviewed_at = NOW(),
           review_note = $4, updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [submissionId, actor.tenantId, actor.userId, reviewNote ?? null]
      );
      await audit(client, actor, 'payment_submission.rejected', 'payment_submission', submissionId);
      await client.query('COMMIT');
      return toApi(rejected.rows[0]);
    }

    const chargeLock = await client.query(
      `SELECT id FROM charges
       WHERE id = $1 AND tenant_id = $2 FOR UPDATE`,
      [submission.charge_id, actor.tenantId]
    );
    if (!chargeLock.rows[0]) throw new Error('NOT_FOUND: Cargo no encontrado');

    const balanceResult = await client.query(
      `SELECT c.total_cents - COALESCE(SUM(pa.amount_cents), 0) AS balance_cents
       FROM charges c
       LEFT JOIN payment_allocations pa
         ON pa.charge_id = c.id AND pa.tenant_id = c.tenant_id
       WHERE c.id = $1 AND c.tenant_id = $2
       GROUP BY c.id`,
      [submission.charge_id, actor.tenantId]
    );
    const balanceCents = Number(balanceResult.rows[0]?.balance_cents ?? 0);
    if (Number(submission.amount_cents) > balanceCents) {
      throw new Error('CONFLICT: El pago excede el saldo del cargo');
    }

    const paymentResult = await client.query(
      `INSERT INTO payments
         (tenant_id, household_id, submission_id, amount_cents, currency,
          provider, channel, external_reference, received_at, recorded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),$9)
       ON CONFLICT (submission_id) DO NOTHING RETURNING *`,
      [
        actor.tenantId,
        submission.household_id,
        submission.id,
        submission.amount_cents,
        submission.currency,
        submission.provider,
        submission.channel,
        submission.external_reference,
        actor.userId,
      ]
    );
    const payment =
      paymentResult.rows[0] ??
      (
        await client.query(
          `SELECT * FROM payments WHERE submission_id = $1 AND tenant_id = $2`,
          [submission.id, actor.tenantId]
        )
      ).rows[0];
    await client.query(
      `INSERT INTO payment_allocations
         (tenant_id, payment_id, charge_id, amount_cents)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (payment_id, charge_id, charge_item_id) DO NOTHING`,
      [actor.tenantId, payment.id, submission.charge_id, submission.amount_cents]
    );
    const receiptIdPart = `${payment.id.slice(0, 8)}${payment.id.slice(9, 13)}`;
    const receiptNumber =
      `REC-${new Date().getUTCFullYear()}-${receiptIdPart.toUpperCase()}`;
    const snapshot = {
      paymentId: payment.id,
      householdId: payment.household_id,
      chargeId: submission.charge_id,
      amountCents: Number(payment.amount_cents),
      currency: payment.currency,
      provider: payment.provider,
      channel: payment.channel,
      externalReference: payment.external_reference,
      receivedAt: payment.received_at,
    };
    const receiptInsert = await client.query(
      `INSERT INTO payment_receipts
         (tenant_id, payment_id, receipt_number, snapshot)
       VALUES ($1,$2,$3,$4::jsonb)
       ON CONFLICT (payment_id) DO NOTHING
       RETURNING id, receipt_number, issued_at, snapshot`,
      [actor.tenantId, payment.id, receiptNumber, JSON.stringify(snapshot)]
    );
    const receipt =
      receiptInsert.rows[0] ??
      (
        await client.query(
          `SELECT id, receipt_number, issued_at, snapshot
           FROM payment_receipts WHERE payment_id = $1 AND tenant_id = $2`,
          [payment.id, actor.tenantId]
        )
      ).rows[0];
    await client.query(
      `UPDATE payment_submissions SET
         status = 'approved', reviewed_by = $3, reviewed_at = NOW(),
         review_note = $4, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [submission.id, actor.tenantId, actor.userId, reviewNote ?? null]
    );
    await client.query(
      `UPDATE charges c SET
         status = CASE
           WHEN totals.allocated_cents >= c.total_cents THEN 'paid'
           ELSE 'partially_paid'
         END,
         updated_at = NOW()
       FROM (
         SELECT charge_id, SUM(amount_cents) AS allocated_cents
         FROM payment_allocations
         WHERE charge_id = $1 AND tenant_id = $2
         GROUP BY charge_id
       ) totals
       WHERE c.id = totals.charge_id AND c.tenant_id = $2`,
      [submission.charge_id, actor.tenantId]
    );
    await audit(client, actor, 'payment_submission.approved', 'payment_submission', submission.id, {
      paymentId: payment.id,
      receiptNumber,
    });
    await client.query('COMMIT');
    return toApi({ payment, receipt });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const recordRefund = async (
  actor: Actor,
  paymentId: string,
  input: PaymentInput
): Promise<unknown> => {
  assertAdmin(actor);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await setLocalTenantContext(client, actor.tenantId);
    const paymentResult = await client.query(
      `SELECT p.*,
         COALESCE((SELECT SUM(pr.amount_cents) FROM payment_refunds pr
                   WHERE pr.payment_id = p.id AND pr.tenant_id = p.tenant_id), 0)
         AS refunded_cents
       FROM payments p
       WHERE p.id = $1 AND p.tenant_id = $2 FOR UPDATE`,
      [paymentId, actor.tenantId]
    );
    const payment = paymentResult.rows[0];
    if (!payment) throw new Error('NOT_FOUND: Pago no encontrado');
    const amountCents = Number(input.amountCents);
    if (amountCents + Number(payment.refunded_cents) > Number(payment.amount_cents)) {
      throw new Error('CONFLICT: El reembolso excede el monto disponible');
    }
    if (input.currency !== payment.currency) {
      throw new Error('VALIDATION: La moneda no coincide con el pago');
    }
    const refundResult = await client.query(
      `INSERT INTO payment_refunds
         (tenant_id, payment_id, amount_cents, currency, provider, channel,
          external_reference, reason, recorded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        actor.tenantId,
        payment.id,
        amountCents,
        input.currency,
        input.provider ?? 'manual',
        input.channel,
        input.externalReference ?? null,
        input.reason,
        actor.userId,
      ]
    );
    await audit(client, actor, 'payment.refunded', 'payment', payment.id, {
      refundId: refundResult.rows[0].id,
      amountCents,
    });
    await client.query('COMMIT');
    return toApi(refundResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getAdminSummary = async (actor: Actor): Promise<unknown> => {
  assertAdmin(actor);
  const result = await tenantQuery(actor.tenantId,
    `SELECT
       COALESCE((SELECT SUM(total_cents) FROM charges WHERE tenant_id = $1 AND status <> 'void'), 0) AS charged_cents,
       COALESCE((SELECT SUM(amount_cents) FROM payments WHERE tenant_id = $1), 0) AS paid_cents,
       COALESCE((SELECT SUM(amount_cents) FROM payment_refunds WHERE tenant_id = $1), 0) AS refunded_cents,
       (SELECT COUNT(*) FROM payment_submissions WHERE tenant_id = $1 AND status = 'pending') AS pending_submissions,
       (SELECT COUNT(*) FROM charges WHERE tenant_id = $1 AND status IN ('open','partially_paid')) AS open_charges`,
    [actor.tenantId]
  );
  return toApi(result.rows[0]);
};

export const getFamilyFinance = async (actor: Actor): Promise<unknown> => {
  if (actor.role !== 'parent' && !isAdmin(actor)) {
    throw new Error('FORBIDDEN: Sin acceso a finanzas familiares');
  }
  if (isAdmin(actor)) {
    throw new Error('VALIDATION: Use el resumen administrativo para este rol');
  }
  const households = await tenantQuery(actor.tenantId,
    `SELECT DISTINCT h.*
     FROM households h
     JOIN guardians g ON g.household_id = h.id AND g.tenant_id = h.tenant_id
     JOIN guardian_players gp
       ON gp.guardian_id = g.id AND gp.tenant_id = g.tenant_id
     WHERE h.tenant_id = $1 AND g.user_id = $2 AND gp.can_view_finances = TRUE`,
    [actor.tenantId, actor.userId]
  );
  const householdIds = households.rows.map((row) => row.id as string);
  const charges = await tenantQuery(actor.tenantId,
    `SELECT c.*,
       COALESCE(SUM(pa.amount_cents), 0) AS allocated_cents,
       c.total_cents - COALESCE(SUM(pa.amount_cents), 0) AS balance_cents
     FROM charges c
     LEFT JOIN payment_allocations pa
       ON pa.charge_id = c.id AND pa.tenant_id = c.tenant_id
     WHERE c.tenant_id = $1 AND c.household_id = ANY($2::uuid[])
     GROUP BY c.id ORDER BY c.due_on NULLS LAST, c.created_at`,
    [actor.tenantId, householdIds]
  );
  const payments = await tenantQuery(actor.tenantId,
    `SELECT p.*, r.receipt_number, r.id AS receipt_id
     FROM payments p
     JOIN payment_receipts r ON r.payment_id = p.id AND r.tenant_id = p.tenant_id
     WHERE p.tenant_id = $1 AND p.household_id = ANY($2::uuid[])
     ORDER BY p.received_at DESC`,
    [actor.tenantId, householdIds]
  );
  const accounts = await listPaymentAccounts(actor);
  return toApi({
    households: households.rows,
    charges: charges.rows,
    payments: payments.rows,
    accounts,
  });
};

export const getReceipt = async (
  actor: Actor,
  receiptId: string
): Promise<unknown> => {
  const result = await tenantQuery(actor.tenantId,
    `SELECT r.*, p.household_id
     FROM payment_receipts r
     JOIN payments p ON p.id = r.payment_id AND p.tenant_id = r.tenant_id
     WHERE r.id = $1 AND r.tenant_id = $2`,
    [receiptId, actor.tenantId]
  );
  const receipt = result.rows[0];
  if (!receipt) throw new Error('NOT_FOUND: Recibo no encontrado');
  if (!(await guardianOwnsHousehold(actor, receipt.household_id))) {
    throw new Error('FORBIDDEN: Sin acceso al recibo');
  }
  return toApi(receipt);
};
