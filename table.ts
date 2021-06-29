import { HasuraApi } from '@deepcase/hasura/api';
import { sql } from '@deepcase/hasura/sql';
import { Trigger } from './trigger';

const api = new HasuraApi({
  path: process.env.MIGRATIONS_HASURA_PATH,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const DEFAULT_SCHEMA = process.env.MIGRATIONS_SCHEMA || 'public';
const DEFAULT_MP_TABLE = process.env.MIGRATIONS_MP_TABLE || 'mp_example__nodes__mp';
const DEFAULT_GRAPH_TABLE = process.env.MIGRATIONS_GRAPH_TABLE || 'mp_example__nodes';
const DEFAULT_ID_TYPE_SQL = process.env.MIGRATIONS_ID_TYPE_SQL || 'integer';

export const up = async ({
  SCHEMA = DEFAULT_SCHEMA, MP_TABLE = DEFAULT_MP_TABLE, ID_TYPE = DEFAULT_ID_TYPE_SQL
} = {}) => {
  await api.sql(sql`
    CREATE TABLE ${SCHEMA}."${MP_TABLE}" (id ${ID_TYPE} PRIMARY KEY,item_id ${ID_TYPE},path_item_id ${ID_TYPE},path_item_depth ${ID_TYPE},root_id ${ID_TYPE},position_id text DEFAULT ${SCHEMA}.gen_random_uuid());
    CREATE SEQUENCE ${SCHEMA}.${MP_TABLE}_id_seq
    AS ${ID_TYPE} START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
    ALTER SEQUENCE ${SCHEMA}.${MP_TABLE}_id_seq OWNED BY ${SCHEMA}.${MP_TABLE}.id;
    ALTER TABLE ONLY ${SCHEMA}.${MP_TABLE} ALTER COLUMN id SET DEFAULT nextval('${SCHEMA}.${MP_TABLE}_id_seq'::regclass);
    CREATE INDEX IF NOT EXISTS ${MP_TABLE}__id_hash ON ${MP_TABLE} USING hash (id);
    CREATE INDEX IF NOT EXISTS ${MP_TABLE}__item_id_hash ON ${MP_TABLE} USING hash (item_id);
    CREATE INDEX IF NOT EXISTS ${MP_TABLE}__item_id_btree ON ${MP_TABLE} USING btree (item_id);
    CREATE INDEX IF NOT EXISTS ${MP_TABLE}__path_item_id_hash ON ${MP_TABLE} USING hash (path_item_id);
    CREATE INDEX IF NOT EXISTS ${MP_TABLE}__path_item_id_btree ON ${MP_TABLE} USING btree (path_item_id);
    CREATE INDEX IF NOT EXISTS ${MP_TABLE}__path_item_depth_btree ON ${MP_TABLE} USING btree (path_item_depth);
    CREATE INDEX IF NOT EXISTS ${MP_TABLE}__root_id_hash ON ${MP_TABLE} USING hash (root_id);
    CREATE INDEX IF NOT EXISTS ${MP_TABLE}__root_id_btree ON ${MP_TABLE} USING btree (root_id);
    CREATE INDEX IF NOT EXISTS ${MP_TABLE}__position_id_hash ON ${MP_TABLE} USING hash (position_id);
    CREATE INDEX IF NOT EXISTS ${MP_TABLE}__position_id_btree ON ${MP_TABLE} USING btree (position_id);
  `);
  await api.query({
    type: 'track_table',
    args: {
      schema: SCHEMA,
      name: MP_TABLE,
    },
  });
};

export const down = async ({
  SCHEMA = DEFAULT_SCHEMA, MP_TABLE = DEFAULT_MP_TABLE
} = {}) => {
  await api.query({
    type: 'untrack_table',
    args: {
      table: {
        schema: SCHEMA,
        name: MP_TABLE,
      },
    },
  });
  await api.sql(sql`
    DROP TABLE ${SCHEMA}."${MP_TABLE}";
  `);
};
