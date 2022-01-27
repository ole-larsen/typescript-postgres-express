-- Up Migration
CREATE TABLE IF NOT EXISTS roles (
    id          SERIAL PRIMARY KEY,
    title       varchar(255) UNIQUE NOT NULL,
    description text NOT NULL,
    enabled     bool NOT NULL DEFAULT TRUE,
    created    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    removed    TIMESTAMP WITH TIME ZONE DEFAULT NULL
);
INSERT INTO roles (title, description, enabled) VALUES ( 'superadmin', 'main system role', true) ON CONFLICT (title) DO NOTHING;
INSERT INTO roles (title, description, enabled) VALUES ( 'admin',      'admin system role', true) ON CONFLICT (title) DO NOTHING;
INSERT INTO roles (title, description, enabled) VALUES ( 'user',       'default user role', true) ON CONFLICT (title) DO NOTHING;
INSERT INTO roles (title, description, enabled) VALUES ( 'manager',    'default manager role', true) ON CONFLICT (title) DO NOTHING;

-- Down Migration
DROP TABLE IF EXISTS roles;