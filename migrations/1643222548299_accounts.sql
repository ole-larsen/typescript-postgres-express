-- Up Migration
CREATE TABLE IF NOT EXISTS accounts (
    id                     SERIAL PRIMARY KEY,
    name                   varchar(255) UNIQUE NOT NULL,
    email                  varchar(255),
    status                 varchar(255),
    enabled                bool NOT NULL DEFAULT TRUE,
    created                TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated                TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    removed                TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Down Migration
DROP TABLE IF EXISTS accounts;
