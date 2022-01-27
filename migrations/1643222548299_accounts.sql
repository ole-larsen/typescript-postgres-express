-- Up Migration
CREATE TABLE IF NOT EXISTS accounts (
    id                     SERIAL PRIMARY KEY,
    name                   varchar(255) UNIQUE NOT NULL,
    email                  varchar(255),
    uid                    varchar(255),
    fid                    varchar(255),
    customer_portal_id     varchar(255),
    type                   varchar(255),
    status                 varchar(255),
    enabled                bool NOT NULL DEFAULT TRUE,
    created                TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated                TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    removed                TIMESTAMP WITH TIME ZONE DEFAULT NULL
);
CREATE TABLE IF NOT EXISTS account_parameters (
     id                          SERIAL PRIMARY KEY,
     account_id                  INT NOT NULL,
     loans_to_value_initial      NUMERIC,
     loans_to_value_liquidation  NUMERIC,
     leverage_ratio              NUMERIC,
     mta                         NUMERIC,
     mc_time                     NUMERIC,
     CONSTRAINT fk_account_id FOREIGN KEY (account_id) REFERENCES accounts (id)
)
-- Down Migration
DROP TABLE IF EXISTS account_parameters CASCADE;
DROP TABLE IF EXISTS accounts;
