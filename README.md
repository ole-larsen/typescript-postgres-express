# TimeSeries application based on postgres partitioning over time
This application contains:
1. User signin/signup/restore with 2FA
2. Simple RBAC for users, based on roles
3. Demonstration how to work with many-to-many relations in postgres (relations between users, roles, accounts)
4. Using DTO pattern
5. Using partitioning by list and range to keep bunches of timeseries data
6. Simple metrics collector (you can pass any api endpoind to query and start to collect metrics by keyword using inner cron)
7. Migrations by pg-migrations
8. Class-based architecture
9. Vue2 based frontend using Vuex
10. Docker configuration
Stack:
express
pg
vue2
Postgres DATABASE_URL=postgresql://services:services@postgres:5432/services

* `npm run migration:create -- {name}` - Create database migration file with `{name}`. Need `DATABASE_URL` [environment variable](#environment-variables).
* `npm run migration:run` - Start database migrations. Need `DATABASE_URL` [environment variable](#environment-variables).
* `npm run migration:down` - Revert last database migration. Need `DATABASE_URL` [environment variable](#environment-variables).

