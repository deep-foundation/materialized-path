import { HasuraApi } from '@deep-foundation/hasura/api';
import { sql } from '@deep-foundation/hasura/sql';
import { Trigger } from './trigger';

const DEFAULT_SCHEMA = process.env.MIGRATIONS_SCHEMA || 'public';
const DEFAULT_MP_TABLE = process.env.MIGRATIONS_MP_TABLE || 'mp_example__links__mp';
const DEFAULT_GRAPH_TABLE = process.env.MIGRATIONS_GRAPH_TABLE || 'mp_example__links';
const DEFAULT_ID_TYPE_SQL = process.env.MIGRATIONS_ID_TYPE_SQL || 'integer';

export const up = async ({
  api, SCHEMA = DEFAULT_SCHEMA, MP_TABLE = DEFAULT_MP_TABLE, ID_TYPE = DEFAULT_ID_TYPE_SQL, customColumns = ''
}: {
  api: HasuraApi;
  SCHEMA?: string; MP_TABLE?: string; ID_TYPE?: string; customColumns: string;
}) => {
  await api.sql(sql`
    CREATE TABLE ${SCHEMA}."${MP_TABLE}" (id ${ID_TYPE} PRIMARY KEY,item_id ${ID_TYPE},path_item_id ${ID_TYPE},path_item_depth ${ID_TYPE},root_id ${ID_TYPE},position_id text DEFAULT ${SCHEMA}.gen_random_uuid(),group_id ${ID_TYPE},insert_category TEXT${customColumns});
    CREATE SEQUENCE ${SCHEMA}.${MP_TABLE}_id_seq
    AS ${ID_TYPE} START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
    ALTER SEQUENCE ${SCHEMA}.${MP_TABLE}_id_seq OWNED BY ${SCHEMA}.${MP_TABLE}.id;
    ALTER TABLE ONLY ${SCHEMA}.${MP_TABLE} ALTER COLUMN id SET DEFAULT nextval('${SCHEMA}.${MP_TABLE}_id_seq'::regclass);
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
  SCHEMA = DEFAULT_SCHEMA, MP_TABLE = DEFAULT_MP_TABLE, api
}: {
  SCHEMA?: string; MP_TABLE?: string; api: HasuraApi;
}) => {
  await api.query({
    type: 'untrack_table',
    args: {
      table: {
        schema: SCHEMA,
        name: MP_TABLE,
      },
      cascade: true,
    },
  });
  await api.sql(sql`
    DROP TABLE ${SCHEMA}."${MP_TABLE}" CASCADE;
  `);
};
