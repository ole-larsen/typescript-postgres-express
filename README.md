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
11. add root user DEFAULT_USER_USERNAME=<from env> 
12. add root user DEFAULT_USER_PASSWORD=<from env>
13. add root user DEFAULT_USER_EMAIL=<from env>
14. add provider url PROVIDER_URL=http://provider:5551
15. add CRUD for users
16. add CRUD for roles
17. frontend is controlling by vuex
18. add CRUD and relations for accounts


***
Application structure:

        -- api
           -- src
              -- controllers      
              -- db
                 -- entities
                    -- account.entity.ts 
                    -- roles.entity.ts
                    -- users.entity.ts
             -- interfaces
                -- account.interface.ts 
                -- roles.interface.ts
                -- users.interface.ts
             -- storage
                -- postgres 
                   -- repository
                     -- account.repository.ts
                     -- role.repository.ts
                     -- user.repository.ts
                     -- constants.repository.ts
                   -- postgres.factory.ts
                   -- mongodb.factory.ts
                   -- redis.factory.ts
              -- monitoring
                 -- prometheus.ts
              -- routes
                 -- account.route.ts
                 -- api.route.ts
                 -- auth.route.ts
                 -- role.route.ts
                 -- user.route.ts
              -- services
                 -- app.service.ts
                 -- app.app.constants.ts
                 -- swagger.service.ts
              -- types
                 -- app.d.ts
                 -- ...
              -- util
                 -- logger.ts
                 -- secrets.ts
              -- app.ts
        -- application
           -- config
           -- public
           -- src
           -- tests
           -- package.json
           -- package-lock.json
           -- Dockerfile
        -- coverage
        -- docker
        -- migrations
        -- provider
        -- test
           -- api
              -- src
                -- routes
                  -- account.route.test.ts
                  -- api.route.test.ts
                  -- auth.route.test.ts
                  -- role.route.test.ts
                  -- user.route.test.ts
                -- services
                  -- app.services.test.ts
                --app.test.ts
        -- Dockerfile
        -- docker-compose.yml