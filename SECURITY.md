# Security Policy

## Reporting a vulnerability

Do not open a public issue for suspected vulnerabilities or exposed personal
data. Contact the project owner through the private support channel configured
for the deployment and include:

- affected endpoint or feature;
- steps to reproduce;
- tenant and role used, without sharing credentials;
- observed and expected behavior;
- potential impact.

## Secrets

Secrets must be supplied through the deployment platform or an untracked
`.env` file. Files matching `.env*` are ignored except for `.env.example`
templates. Never commit tokens, passwords, payment credentials, database dumps,
or production tenant identifiers.

If a secret is committed, deleting the file is not sufficient. Revoke or rotate
the credential first, then coordinate any history cleanup with all repository
contributors.

## Multi-tenant incidents

Any suspected cross-tenant access is a critical incident:

1. disable the affected operation;
2. preserve audit and application logs;
3. rotate relevant credentials;
4. identify affected tenants and data;
5. remediate and add a regression test;
6. follow the applicable legal notification process before restoring access.
