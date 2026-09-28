# Playbook: Database migrations

Internal playbook, run through the `jal-orchestration` engine by a JAL command (see `../SKILL.md` for which command runs it). Run the Postgres migration runner (tools/migrate.ts) over migrations/*.sql. Supports up, down, and create.

Run the migration subcommand `<arg1>` (full argument: <request>) via `tools/migrate.ts`. Reference skill `jal-standards`: raw SQL migrations only, no ORM (no Prisma, no Drizzle, no TypeORM, no Sequelize), this runner is the whole story for schema changes.

## Steps, in order

1. **Validate `<arg1>`.** Must be `up`, `down`, or `create`. Anything else, print usage and stop.
2. **If `<arg1>` is `create`:** `<arg2>` is required as the migration name. Run `bun tools/migrate.ts create <arg2>`, which writes a new timestamped file `migrations/<timestamp>_<arg2>.sql` with an `-- up` and `-- down` section. Report the created file path.
3. **If `<arg1>` is `up`:** Run `bun tools/migrate.ts up` against `DATABASE_URL`. This applies every pending migration in `migrations/*.sql` in timestamp order inside a transaction per file. Report which migrations ran.
4. **If `<arg1>` is `down`:** Run `bun tools/migrate.ts down`. This reverts only the single most recently applied migration using its `-- down` section. Report which migration was reverted.
5. **Never hand-edit the schema outside a migration file.** If `tools/migrate.ts` is missing from the project, stop and tell the user to scaffold it from the JAL-AIDEV template first, do not improvise a raw `psql` command as a substitute.

Report the runner's output verbatim for the affected migration(s), pass or fail. Stay terse.
