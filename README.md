1. Remove views
2. Add Postgres DATABASE_URL=postgresql://services:services@postgres:5432/services
3. Add Postgres DATABASE_PORT=5432
4. Add Redis    REDIS_URL=redis://redis
5. Add Redis    REDIS_PORT=6379
6. Add Mongodb  MONGODB_URL=mongodb://app001-mongo:27017/service
7. Add Mongodb  MONGODB_PORT=27017
8. Add commands:
* `npm run migration:create -- {name}` - Create database migration file with `{name}`. Need `DATABASE_URL` [environment variable](#environment-variables).
* `npm run migration:run` - Start database migrations. Need `DATABASE_URL` [environment variable](#environment-variables).
* `npm run migration:down` - Revert last database migration. Need `DATABASE_URL` [environment variable](#environment-variables).
9. Add role table
10. Add users table
11. add root user DEFAULT_USER_USERNAME=root 
12. add root user DEFAULT_USER_PASSWORD=emptypassword
13. add root user DEFAULT_USER_EMAIL=ole.larssen777@gmail.com
14. add provider url PROVIDER_URL=http://provider:5551
15. add CRUD for users
16. add CRUD for roles
17. frontend is controlling by vuex
