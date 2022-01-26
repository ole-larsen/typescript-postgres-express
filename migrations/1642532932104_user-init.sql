-- Up Migration
CREATE TABLE IF NOT EXISTS users (
    id                     SERIAL PRIMARY KEY,
    username               varchar(255) UNIQUE NOT NULL,
    email                  varchar(255) UNIQUE NOT NULL,
    password               varchar(255) NOT NULL,
    "passwordResetToken"   varchar(255),
    "passwordResetExpires" BIGINT,
    enabled                bool NOT NULL DEFAULT TRUE,
    secret                 varchar(255),
    gravatar               varchar(255),
    created                TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated                TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    removed                TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Down Migration
DROP TABLE IF EXISTS users;