-- Up Migration
CREATE TABLE IF NOT EXISTS timeseries (
    task_id integer NOT NULL,
    value NUMERIC,
    text character varying(255),
    created timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    removed timestamp with time zone
) PARTITION BY RANGE (created);

CREATE INDEX ON timeseries(created);

ALTER TABLE timeseries ADD CONSTRAINT timeseries_task_id_pkey
    PRIMARY KEY (task_id, created);
ALTER TABLE timeseries ADD CONSTRAINT timeseries_task_id_foreign
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Down Migration
DROP TABLE IF EXISTS timeseries;
