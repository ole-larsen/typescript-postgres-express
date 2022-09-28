-- Up Migration
CREATE TABLE IF NOT EXISTS tasks (
    id                     SERIAL PRIMARY KEY,
    name                   varchar(255),
    identity               varchar(255),
    config                 jsonb,
    status                 varchar(255),
    enabled                bool NOT NULL DEFAULT TRUE,
    created                TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated                TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    removed                TIMESTAMP WITH TIME ZONE DEFAULT NULL
 );

-- Down Migration
DROP TABLE IF EXISTS tasks;
