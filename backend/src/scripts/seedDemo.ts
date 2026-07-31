import { Pool, PoolClient } from 'pg';
import bcrypt from 'bcrypt';
import { v5 as uuidv5 } from 'uuid';

interface DemoTenant {
  key: string;
  name: string;
  contactEmail: string;
  description: string;
  slogan: string;
  phone: string;
  primaryColor: string;
  secondaryColor: string;
  location: string;
  address: string;
  adminEmail: string;
  coachEmail: string;
  parentEmail: string;
  coachName: [string, string];
  parentName: [string, string];
  teamNames: [string, string];
  playerNames: Array<[string, string]>;
  bankName: string;
  accountNumber: string;
}

const databaseUrl = process.env.MIGRATOR_DATABASE_URL;
const demoPassword = process.env.DEMO_PASSWORD;
const namespace = 'b87dd60b-8b93-4a18-90bb-f7f341069bbc';

if (!databaseUrl) throw new Error('MIGRATOR_DATABASE_URL is required');
if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== 'true') {
  throw new Error('Set ALLOW_DEMO_SEED=true to seed a production database');
}
if (!demoPassword || demoPassword.length < 14) {
  throw new Error('DEMO_PASSWORD must contain at least 14 characters');
}

const tenants: DemoTenant[] = [
  {
    key: 'los-andes',
    name: 'Academia de Fútbol Los Andes',
    contactEmail: 'contacto@losandes.demo',
    description: 'Academia formativa enfocada en técnica, disciplina y desarrollo integral.',
    slogan: 'Formamos talento, construimos futuro',
    phone: '+57 300 555 0101',
    primaryColor: '#059669',
    secondaryColor: '#0f172a',
    location: 'Sede Deportiva El Poblado',
    address: 'Carrera 34 #10-25, Medellín',
    adminEmail: 'admin@losandes.demo',
    coachEmail: 'coach@losandes.demo',
    parentEmail: 'familia@losandes.demo',
    coachName: ['Carlos', 'Restrepo'],
    parentName: ['Laura', 'Gómez'],
    teamNames: ['Sub-12 Cóndores', 'Sub-15 Montañeros'],
    playerNames: [
      ['Mateo', 'Gómez'], ['Santiago', 'Gómez'], ['Samuel', 'Ruiz'],
      ['Tomás', 'Londoño'], ['Emiliano', 'Castro'], ['Nicolás', 'Vélez'],
    ],
    bankName: 'Bancolombia',
    accountNumber: '01234567890',
  },
  {
    key: 'caribe',
    name: 'Escuela Deportiva Caribe FC',
    contactEmail: 'contacto@caribefc.demo',
    description: 'Escuela de fútbol base con metodología moderna y valores de equipo.',
    slogan: 'Pasión que se entrena',
    phone: '+57 301 555 0202',
    primaryColor: '#0284c7',
    secondaryColor: '#f97316',
    location: 'Complejo Deportivo La Marina',
    address: 'Avenida del Río #45-18, Barranquilla',
    adminEmail: 'admin@caribefc.demo',
    coachEmail: 'coach@caribefc.demo',
    parentEmail: 'familia@caribefc.demo',
    coachName: ['Andrés', 'Mendoza'],
    parentName: ['Marcela', 'Torres'],
    teamNames: ['Sub-11 Tiburones', 'Sub-14 Delfines'],
    playerNames: [
      ['Sebastián', 'Torres'], ['Martín', 'Torres'], ['Jerónimo', 'Díaz'],
      ['Thiago', 'Martínez'], ['Gabriel', 'Pérez'], ['Juan José', 'Acosta'],
    ],
    bankName: 'Davivienda',
    accountNumber: '09876543210',
  },
];

const id = (tenantKey: string, entity: string): string =>
  uuidv5(`${tenantKey}:${entity}`, namespace);

const dateFromToday = (days: number): string => {
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
};

const birthdayFromToday = (days: number, birthYear: number): string => {
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCFullYear(birthYear);
  return date.toISOString().slice(0, 10);
};

const seedTenant = async (
  client: PoolClient,
  tenant: DemoTenant,
  passwordHash: string
): Promise<void> => { // NOSONAR: fixture orchestration intentionally mirrors the relational model.
  const tenantId = id(tenant.key, 'tenant');
  const adminId = id(tenant.key, 'user-admin');
  const coachUserId = id(tenant.key, 'user-coach');
  const parentUserId = id(tenant.key, 'user-parent');
  const coachId = id(tenant.key, 'coach');
  const locationId = id(tenant.key, 'location');
  const seasonId = id(tenant.key, 'season-2026');
  const householdId = id(tenant.key, 'household-primary');
  const guardianId = id(tenant.key, 'guardian-primary');
  const teamIds = tenant.teamNames.map((_, index) => id(tenant.key, `team-${index + 1}`));
  const playerIds = tenant.playerNames.map((_, index) => id(tenant.key, `player-${index + 1}`));

  await client.query(
    'DELETE FROM tenants WHERE id = $1 OR LOWER(email_contacto) = LOWER($2)',
    [tenantId, tenant.contactEmail]
  );
  await client.query(
    `INSERT INTO tenants
       (id, nombre, email_contacto, foundation_date, description, slogan, telefono,
        email, instagram_url, primary_color, secondary_color)
     VALUES ($1,$2,$3,'2018-01-15',$4,$5,$6,$3,$7,$8,$9)`,
    [
      tenantId, tenant.name, tenant.contactEmail, tenant.description, tenant.slogan,
      tenant.phone, `https://instagram.com/${tenant.key}`, tenant.primaryColor,
      tenant.secondaryColor,
    ]
  );
  await client.query(
    `INSERT INTO users (id, tenant_id, nombre, email, password_hash, rol, is_active)
     VALUES
       ($1,$4,'Administrador Demo',$5,$7,'admin',TRUE),
       ($2,$4,$8,$6,$7,'coach',TRUE),
       ($3,$4,$9,$10,$7,'parent',TRUE)`,
    [
      adminId, coachUserId, parentUserId, tenantId, tenant.adminEmail, tenant.coachEmail,
      passwordHash, tenant.coachName.join(' '), tenant.parentName.join(' '),
      tenant.parentEmail,
    ]
  );
  await client.query(
    `INSERT INTO locations (id, tenant_id, name, address, timezone)
     VALUES ($1,$2,$3,$4,'America/Bogota')`,
    [locationId, tenantId, tenant.location, tenant.address]
  );
  await client.query(
    `INSERT INTO seasons (id, tenant_id, name, starts_on, ends_on, is_active)
     VALUES ($1,$2,'Temporada 2026','2026-01-15','2026-12-15',TRUE)`,
    [seasonId, tenantId]
  );
  await client.query(
    `INSERT INTO coaches (id, tenant_id, nombre, apellido, email, telefono)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [
      coachId, tenantId, tenant.coachName[0], tenant.coachName[1],
      tenant.coachEmail, tenant.phone,
    ]
  );
  for (let index = 0; index < teamIds.length; index += 1) {
    await client.query(
      `INSERT INTO teams
         (id, tenant_id, nombre, categoria, entrenador_id, descripcion)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        teamIds[index], tenantId, tenant.teamNames[index],
        index === 0 ? 'Sub-12' : 'Sub-15', coachId,
        'Equipo de demostración con planificación deportiva activa.',
      ]
    );
    await client.query(
      `INSERT INTO coach_team_assignments
         (id, tenant_id, coach_id, team_id, season_id, role, starts_on)
       VALUES ($1,$2,$3,$4,$5,'head_coach','2026-01-15')`,
      [id(tenant.key, `assignment-${index + 1}`), tenantId, coachId, teamIds[index], seasonId]
    );
  }

  for (let index = 0; index < playerIds.length; index += 1) {
    const [firstName, lastName] = tenant.playerNames[index];
    await client.query(
      `INSERT INTO players
         (id, tenant_id, nombre, apellido, cedula, fecha_nacimiento, categoria,
          padre_nombre, padre_apellido, padre_email, padre_telefono)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        playerIds[index], tenantId, firstName, lastName,
        `DEMO-${tenant.key.toUpperCase()}-${index + 1}`,
        birthdayFromToday([0, 3, 10, 25, 40, 70][index], 2013 - (index % 3)),
        index < 3 ? 'Sub-12' : 'Sub-15',
        tenant.parentName[0], tenant.parentName[1], tenant.parentEmail, tenant.phone,
      ]
    );
    await client.query(
      `INSERT INTO player_teams (id, tenant_id, player_id, team_id)
       VALUES ($1,$2,$3,$4)`,
      [
        id(tenant.key, `player-team-${index + 1}`), tenantId, playerIds[index],
        index < 3 ? teamIds[0] : teamIds[1],
      ]
    );
  }

  await client.query(
    `INSERT INTO households
       (id, tenant_id, name, billing_email, billing_phone, address)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [
      householdId, tenantId, `Familia ${tenant.parentName[1]}`, tenant.parentEmail,
      tenant.phone, tenant.address,
    ]
  );
  await client.query(
    `INSERT INTO guardians
       (id, tenant_id, household_id, user_id, first_name, last_name, email, phone, is_primary)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE)`,
    [
      guardianId, tenantId, householdId, parentUserId, tenant.parentName[0],
      tenant.parentName[1], tenant.parentEmail, tenant.phone,
    ]
  );
  for (const playerId of playerIds.slice(0, 2)) {
    await client.query(
      `INSERT INTO guardian_players
         (tenant_id, guardian_id, player_id, relationship, can_view_finances, can_submit_payments)
       VALUES ($1,$2,$3,'parent',TRUE,TRUE)`,
      [tenantId, guardianId, playerId]
    );
  }

  const trainingIds = [0, 1, 2, 3].map((index) => id(tenant.key, `training-${index + 1}`));
  const trainingDays = [-2, 1, 3, 6];
  for (let index = 0; index < trainingIds.length; index += 1) {
    await client.query(
      `INSERT INTO trainings
         (id, tenant_id, equipo_id, fecha, descripcion, lugar, hora_inicio, hora_fin,
          es_recurrente, color, estado)
       VALUES ($1,$2,$3,$4,$5,$6,'16:00','18:00',FALSE,$7,'programado')`,
      [
        trainingIds[index], tenantId, index % 2 === 0 ? teamIds[0] : teamIds[1],
        dateFromToday(trainingDays[index]), index === 0 ? 'Técnica y posesión' : 'Sesión integral',
        tenant.location, tenant.primaryColor,
      ]
    );
  }
  for (let index = 0; index < 3; index += 1) {
    await client.query(
      `INSERT INTO attendance (id, tenant_id, training_id, player_id, presente)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        id(tenant.key, `attendance-${index + 1}`), tenantId, trainingIds[0],
        playerIds[index], index !== 2,
      ]
    );
  }

  const upcomingMatchId = id(tenant.key, 'match-upcoming');
  await client.query(
    `INSERT INTO matches
       (id, tenant_id, equipo_local_id, equipo_visitante_id, fecha, kickoff_time,
        lugar, competition, match_type, status, notes)
     VALUES
       ($1,$2,$3,$4,$5,'10:00',$6,'Liga Formativa','league','scheduled','Partido de demostración'),
       ($7,$2,$4,$3,$8,'09:00',$6,'Liga Formativa','league','completed','Encuentro finalizado')`,
    [
      upcomingMatchId, tenantId, teamIds[0], teamIds[1], dateFromToday(5),
      tenant.location, id(tenant.key, 'match-past'), dateFromToday(-7),
    ]
  );
  for (let index = 0; index < 3; index += 1) {
    await client.query(
      `INSERT INTO match_convocations
         (id, tenant_id, match_id, player_id, status, position, is_starter, jersey_number)
       VALUES ($1,$2,$3,$4,'convocado',$5,$6,$7)`,
      [
        id(tenant.key, `convocation-${index + 1}`), tenantId, upcomingMatchId,
        playerIds[index], ['Portero', 'Defensa', 'Delantero'][index], index < 2, index + 1,
      ]
    );
  }

  for (let playerIndex = 0; playerIndex < 2; playerIndex += 1) {
    for (let testIndex = 0; testIndex < 2; testIndex += 1) {
      await client.query(
        `INSERT INTO physical_tests
           (id, tenant_id, player_id, fecha_prueba, altura, peso, velocidad_40m,
            salto_vertical, cooper_test, precision_tiro, control_balon, pase_precision,
            observaciones, evaluador)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          id(tenant.key, `test-${playerIndex + 1}-${testIndex + 1}`), tenantId,
          playerIds[playerIndex], testIndex === 0 ? '2026-03-15' : '2026-07-15',
          145 + playerIndex * 3 + testIndex, 38 + playerIndex * 2 + testIndex,
          7.6 - testIndex * 0.25, 28 + testIndex * 3, 1850 + testIndex * 150,
          6 + testIndex, 7 + testIndex, 6 + testIndex,
          testIndex === 0 ? 'Evaluación inicial' : 'Progreso favorable',
          tenant.coachName.join(' '),
        ]
      );
    }
  }

  const accountId = id(tenant.key, 'payment-account');
  const conceptId = id(tenant.key, 'fee-concept');
  await client.query(
    `INSERT INTO payment_accounts
       (id, tenant_id, name, account_type, instructions, bank_name, account_holder,
        account_number, currency, display_order)
     VALUES ($1,$2,'Cuenta principal','bank',$3,$4,$5,$6,'USD',1)`,
    [
      accountId, tenantId, 'Realiza la transferencia y adjunta el comprobante.',
      tenant.bankName, tenant.name, tenant.accountNumber,
    ]
  );
  await client.query(
    `INSERT INTO fee_concepts
       (id, tenant_id, name, description, default_amount_cents, currency)
     VALUES ($1,$2,'Mensualidad','Mensualidad de formación deportiva',7500,'USD')`,
    [conceptId, tenantId]
  );
  const chargeData = [
    { key: 'overdue', description: 'Mensualidad julio', amount: 7500, due: -10 },
    { key: 'upcoming', description: 'Torneo interescuelas', amount: 4500, due: 12 },
  ];
  for (const charge of chargeData) {
    const chargeId = id(tenant.key, `charge-${charge.key}`);
    await client.query(
      `INSERT INTO charges
         (id, tenant_id, household_id, player_id, season_id, description, currency,
          total_cents, due_on, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,'USD',$7,$8,'open',$9)`,
      [
        chargeId, tenantId, householdId, playerIds[0], seasonId, charge.description,
        charge.amount, dateFromToday(charge.due), adminId,
      ]
    );
    await client.query(
      `INSERT INTO charge_items
         (id, tenant_id, charge_id, fee_concept_id, description, quantity, unit_amount_cents)
       VALUES ($1,$2,$3,$4,$5,1,$6)`,
      [
        id(tenant.key, `charge-item-${charge.key}`), tenantId, chargeId, conceptId,
        charge.description, charge.amount,
      ]
    );
  }
  await client.query(
    `INSERT INTO notifications
       (id, tenant_id, user_id, household_id, channel, subject, body, status, sent_at)
     VALUES
       ($1,$2,$3,$4,'in_app','Bienvenida a la temporada',$5,'sent',NOW()),
       ($6,$2,$3,$4,'in_app','Próximo partido',$7,'sent',NOW())`,
    [
      id(tenant.key, 'notification-welcome'), tenantId, parentUserId, householdId,
      `La familia ${tenant.parentName[1]} ya puede consultar agenda, pagos y progreso.`,
      id(tenant.key, 'notification-match'),
      `El próximo partido se jugará en ${tenant.location}.`,
    ]
  );
};

const run = async (): Promise<void> => {
  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  const client = await pool.connect();
  try {
    const passwordHash = await bcrypt.hash(demoPassword, 12);
    await client.query('BEGIN');
    for (const tenant of tenants) await seedTenant(client, tenant, passwordHash);
    await client.query('COMMIT');
    for (const tenant of tenants) {
      process.stdout.write(
        `${tenant.name}: ${tenant.adminEmail}, ${tenant.coachEmail}, ${tenant.parentEmail}\n`
      );
    }
    process.stdout.write('Demo data ready\n');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

void run().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Demo seed failed'}\n`);
  process.exitCode = 1;
});
