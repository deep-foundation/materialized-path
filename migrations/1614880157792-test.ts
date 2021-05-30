import { HasuraApi } from '@deepcase/hasura/api';
import { sql } from '@deepcase/hasura/sql';
import { Trigger } from '../trigger';

import { up as upTable, down as downTable } from '../table';
import { up as upRels, down as downRels } from '../relationships';

const api = new HasuraApi({
  path: process.env.MIGRATIONS_HASURA_PATH,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const DEFAULT_SCHEMA = process.env.MIGRATIONS_SCHEMA || 'public';
const DEFAULT_MP_TABLE = process.env.MIGRATIONS_MP_TABLE || 'mp_example__nodes__mp';
const DEFAULT_GRAPH_TABLE = process.env.MIGRATIONS_GRAPH_TABLE || 'mp_example__nodes';
const DEFAULT_ID_TYPE = process.env.MIGRATIONS_ID_TYPE_SQL || 'integer';

export const up = async ({
  SCHEMA = DEFAULT_SCHEMA, MP_TABLE = DEFAULT_MP_TABLE, GRAPH_TABLE = DEFAULT_GRAPH_TABLE, ID_TYPE = DEFAULT_ID_TYPE,
  trigger = Trigger({
    mpTableName: MP_TABLE,
    graphTableName: GRAPH_TABLE,
    id_type: DEFAULT_ID_TYPE,
  }),
} = {}) => {
  await api.sql(sql`
    CREATE TABLE ${SCHEMA}."${GRAPH_TABLE}" (id ${ID_TYPE}, from_id ${ID_TYPE}, to_id ${ID_TYPE}, type_id ${ID_TYPE});
    CREATE SEQUENCE ${GRAPH_TABLE}_id_seq
    AS ${ID_TYPE} START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
    ALTER SEQUENCE ${GRAPH_TABLE}_id_seq OWNED BY ${SCHEMA}."${GRAPH_TABLE}".id;
    ALTER TABLE ONLY ${SCHEMA}."${GRAPH_TABLE}" ALTER COLUMN id SET DEFAULT nextval('${GRAPH_TABLE}_id_seq'::regclass);
  `);
  await api.query({
    type: 'track_table',
    args: {
      schema: SCHEMA,
      name: GRAPH_TABLE,
    },
  });
  await api.query({
    type: 'create_select_permission',
    args: {
      table: GRAPH_TABLE,
      role: 'guest',
      permission: {
        columns: '*',
        filter: {},
        limit: 999,
        allow_aggregations: true
      }
    }
  });
  await api.query({
    type: 'create_select_permission',
    args: {
      table: GRAPH_TABLE,
      role: 'user',
      permission: {
        columns: '*',
        filter: {},
        limit: 999,
        allow_aggregations: true
      }
    }
  });
  await upTable({ SCHEMA, MP_TABLE });
  await api.query({
    type: 'create_select_permission',
    args: {
      table: MP_TABLE,
      role: 'guest',
      permission: {
        columns: '*',
        filter: {},
        limit: 999,
        allow_aggregations: true
      }
    }
  });
  await api.query({
    type: 'create_select_permission',
    args: {
      table: MP_TABLE,
      role: 'user',
      permission: {
        columns: '*',
        filter: {},
        limit: 999,
        allow_aggregations: true
      }
    }
  });
  await upRels({ SCHEMA, MP_TABLE, GRAPH_TABLE });
  await api.sql(trigger.upFunctionIsRoot());
  await api.sql(trigger.upFunctionWillRoot());
  await api.sql(trigger.upFunctionInsertNode());
  await api.sql(trigger.upFunctionDeleteNode());
  await api.sql(trigger.upTriggerDelete());
  await api.sql(trigger.upTriggerInsert());
};

export const down = async ({
  SCHEMA = DEFAULT_SCHEMA, MP_TABLE = DEFAULT_MP_TABLE, GRAPH_TABLE = DEFAULT_GRAPH_TABLE,
  trigger = Trigger({
    mpTableName: MP_TABLE,
    graphTableName: GRAPH_TABLE,
    id_type: DEFAULT_ID_TYPE,
  }),
} = {}) => {
  await api.sql(trigger.downTriggerDelete());
  await api.sql(trigger.downTriggerInsert());
  await api.sql(trigger.downFunctionInsertNode());
  await api.sql(trigger.downFunctionDeleteNode());
  await api.sql(trigger.downFunctionIsRoot());
  await api.sql(trigger.downFunctionWillRoot());
  await downRels({ SCHEMA, MP_TABLE, GRAPH_TABLE });
  await downTable({ SCHEMA, MP_TABLE });
  await api.query({
    type: 'untrack_table',
    args: {
      table: {
        schema: SCHEMA,
        name: GRAPH_TABLE,
      },
    },
  });
  await api.sql(sql`
    DROP TABLE ${SCHEMA}."${GRAPH_TABLE}";
  `);
};
