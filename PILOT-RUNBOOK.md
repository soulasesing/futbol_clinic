# Runbook del piloto

Este documento define la salida controlada a producción del MVP. No sustituye
la revisión legal de privacidad, tratamiento de datos de menores ni términos
comerciales aplicables en el país del despliegue.

## 1. Preparación

- Usar PostgreSQL 15 administrado con backups automáticos.
- Crear credenciales diferentes para el migrador y la aplicación.
- Rotar cualquier token que haya aparecido previamente en Git.
- Configurar `JWT_SECRET`, orígenes CORS, correo y un Blob privado separado.
- Mantener `MIGRATOR_DATABASE_URL` únicamente en el trabajo de despliegue.
- Configurar alertas sobre respuestas 5xx, latencia y falta de disponibilidad.

Docker requiere las variables documentadas en `env.docker.template`. Validar la
configuración antes de desplegar:

```bash
docker compose config --quiet
docker compose build
docker compose up -d
```

El servicio `migrate` aplica las migraciones antes de iniciar la API. Fuera de
Docker:

```bash
cd backend
MIGRATOR_DATABASE_URL='postgresql://...' yarn migrate
```

Provisionar el primer superadministrador después de migrar:

```bash
SUPER_ADMIN_EMAIL='...' \
SUPER_ADMIN_PASSWORD='...' \
MIGRATOR_DATABASE_URL='postgresql://...' \
yarn create-super-admin
```

## 2. Verificación de despliegue

1. `/api/health` responde 200.
2. `/api/ready` responde 200 y confirma conectividad con PostgreSQL.
3. Un origen no autorizado es rechazado.
4. La aplicación utiliza un rol `NOSUPERUSER NOBYPASSRLS`.
5. El backup diario se crea y un restore aislado termina correctamente.
6. Los logs JSON incluyen `requestId`, ruta, estado y duración.

## 3. Prueba funcional por rol

Crear dos academias de prueba y verificar que ninguna puede consultar datos de
la otra.

### Administrador

- configurar sede, temporada y cuenta de pago;
- crear entrenador, equipo, familia y deportista;
- emitir un cargo y revisar cartera;
- aprobar y rechazar comprobantes;
- consultar recibos y auditoría.

### Entrenador

- ver únicamente equipos asignados;
- crear o consultar entrenamientos y partidos;
- registrar asistencia, convocatoria y resultado;
- consultar deportistas y pruebas físicas permitidas.

### Familia

- ver solamente sus deportistas;
- consultar agenda y responder asistencia;
- ver saldo, cuentas e instrucciones;
- enviar JPG, PNG y PDF válidos de hasta 5 MB;
- recibir el estado del comprobante y consultar recibos.

## 4. Criterios de apertura

- CI verde, incluidas migraciones limpias y prueba RLS.
- Build Docker reproducible.
- Cero secretos conocidos vigentes en el historial o artefactos.
- Restore ensayado durante los últimos 30 días.
- Responsable de soporte y canal privado publicados.
- Textos legales y consentimiento para datos de menores aprobados.
- Cinco usuarios piloto completan los flujos críticos sin ayuda del equipo.

## 5. Despliegue gradual y rollback

1. Abrir a una academia interna durante 48 horas.
2. Incorporar hasta tres academias durante siete días.
3. Revisar diariamente errores, pagos pendientes y soporte.
4. Ampliar solo si no hay acceso cruzado, pérdida de datos ni errores críticos.

Ante una regresión, detener nuevas escrituras, conservar logs, revertir la
versión de aplicación y no revertir migraciones destructivamente. Restaurar una
base únicamente según `BACKUP-RESTORE.md` y después de medir el impacto.
