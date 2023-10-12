import { HasuraApi } from '@deep-foundation/hasura/api';
import { sql } from '@deep-foundation/hasura/sql';
import { Trigger } from '../trigger';

import { up as upTable, down as downTable } from '../table';
import { up as upRels, down as downRels } from '../relationships';
import { up as upPerms, down as downPerms } from '../permissions';

const api = new HasuraApi({
  path: process.env.MIGRATIONS_HASURA_PATH,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const DEFAULT_SCHEMA = 'public';
const DEFAULT_MP_TABLE = 'mp_example__links__mp_md';
const DEFAULT_GRAPH_TABLE = 'mp_example__links_md';
const DEFAULT_ID_TYPE = 'integer';

export const up = async ({
  SCHEMA = DEFAULT_SCHEMA, MP_TABLE = DEFAULT_MP_TABLE, GRAPH_TABLE = DEFAULT_GRAPH_TABLE, ID_TYPE = DEFAULT_ID_TYPE,
  trigger = Trigger({
    mpTableName: MP_TABLE,
    graphTableName: GRAPH_TABLE,

    id_type: DEFAULT_ID_TYPE,

    iteratorInsertBegin: ``,
    iteratorInsertEnd: '',
    groupInsert: '0',
    iteratorDeleteBegin: ``,
    iteratorDeleteEnd: '',
    groupDelete: '0',
    additionalFields: (action: string) => ',"custom"',
    additionalData: (action: string) => `,${action}`,

    isAllowSpreadFromCurrent: "CURRENT.dir = 'down'",
    isAllowSpreadCurrentTo: "CURRENT.dir = 'down'",

    isAllowSpreadToCurrent: "CURRENT.dir = 'up'",
    isAllowSpreadCurrentFrom: "CURRENT.dir = 'up'",

    isAllowSpreadToInCurrent: "flowLink.dir = 'down'",
    isAllowSpreadCurrentFromOut: "flowLink.dir = 'down'",

    isAllowSpreadFromOutCurrent: "flowLink.dir = 'up'",
    isAllowSpreadCurrentToIn: "flowLink.dir = 'up'",
  }),
} = {}) => {
  await api.sql(sql`
    CREATE TABLE ${SCHEMA}."${GRAPH_TABLE}" (id ${ID_TYPE}, from_id ${ID_TYPE}, to_id ${ID_TYPE}, type_id ${ID_TYPE}, dir TEXT);
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
    type: 'create_array_relationship',
    args: {
      table: GRAPH_TABLE,
      name: 'in',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: GRAPH_TABLE,
          },
          column_mapping: {
            id: 'to_id',
          },
          insertion_order: 'after_parent',
        },
      },
    },
  });
  await api.query({
    type: 'create_array_relationship',
    args: {
      table: GRAPH_TABLE,
      name: 'out',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: GRAPH_TABLE,
          },
          column_mapping: {
            id: 'from_id',
          },
          insertion_order: 'after_parent',
        },
      },
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
  await upTable({ SCHEMA, MP_TABLE, customColumns: ',custom TEXT', api });
  await upPerms({ SCHEMA, MP_TABLE, GRAPH_TABLE, api });
  await upRels({ SCHEMA, MP_TABLE, GRAPH_TABLE, api });
  await api.sql(trigger.upFunctionInsertNode());
  await api.sql(trigger.upFunctionDeleteNode());
  await api.sql(trigger.upTriggerDelete());
  await api.sql(trigger.upTriggerInsert());

  await api.sql(`CREATE INDEX IF NOT EXISTS ${GRAPH_TABLE}__id_hash ON ${GRAPH_TABLE} USING hash (id);`);
  await api.sql(`CREATE INDEX IF NOT EXISTS ${GRAPH_TABLE}__from_id_hash ON ${GRAPH_TABLE} USING hash (from_id);`);
  await api.sql(`CREATE INDEX IF NOT EXISTS ${GRAPH_TABLE}__from_id_btree ON ${GRAPH_TABLE} USING btree (from_id);`);
  await api.sql(`CREATE INDEX IF NOT EXISTS ${GRAPH_TABLE}__to_id_hash ON ${GRAPH_TABLE} USING hash (to_id);`);
  await api.sql(`CREATE INDEX IF NOT EXISTS ${GRAPH_TABLE}__to_id_btree ON ${GRAPH_TABLE} USING btree (to_id);`);
  await api.sql(`CREATE INDEX IF NOT EXISTS ${GRAPH_TABLE}__type_id_hash ON ${GRAPH_TABLE} USING hash (type_id);`);
  await api.sql(`CREATE INDEX IF NOT EXISTS ${GRAPH_TABLE}__type_id_btree ON ${GRAPH_TABLE} USING btree (type_id); `);
  await api.sql(`CREATE INDEX IF NOT EXISTS ${GRAPH_TABLE}__dir_hash ON ${GRAPH_TABLE} USING hash (dir);`);
  await api.sql(`CREATE INDEX IF NOT EXISTS ${GRAPH_TABLE}__dir_btree ON ${GRAPH_TABLE} USING btree (dir); `);

  await api.sql(`CREATE INDEX IF NOT EXISTS ${MP_TABLE}__id_hash ON ${MP_TABLE} USING hash (id);`);
  await api.sql(`CREATE INDEX IF NOT EXISTS ${MP_TABLE}__item_id_hash ON ${MP_TABLE} USING hash (item_id);`);
  await api.sql(`CREATE INDEX IF NOT EXISTS ${MP_TABLE}__item_id_btree ON ${MP_TABLE} USING btree (item_id);`);
  await api.sql(`CREATE INDEX IF NOT EXISTS ${MP_TABLE}__path_item_id_hash ON ${MP_TABLE} USING hash (path_item_id);`);
  await api.sql(`CREATE INDEX IF NOT EXISTS ${MP_TABLE}__path_item_id_btree ON ${MP_TABLE} USING btree (path_item_id);`);
  await api.sql(`CREATE INDEX IF NOT EXISTS ${MP_TABLE}__path_item_depth_hash ON ${MP_TABLE} USING hash (path_item_depth);`);
  await api.sql(`CREATE INDEX IF NOT EXISTS ${MP_TABLE}__path_item_depth_btree ON ${MP_TABLE} USING btree (path_item_depth);`);
  await api.sql(`CREATE INDEX IF NOT EXISTS ${MP_TABLE}__root_id_hash ON ${MP_TABLE} USING hash (root_id);`);
  await api.sql(`CREATE INDEX IF NOT EXISTS ${MP_TABLE}__root_id_btree ON ${MP_TABLE} USING btree (root_id);`);
  await api.sql(`CREATE INDEX IF NOT EXISTS ${MP_TABLE}__position_id_hash ON ${MP_TABLE} USING hash (position_id);`);
  await api.sql(`CREATE INDEX IF NOT EXISTS ${MP_TABLE}__position_id_btree ON ${MP_TABLE} USING btree (position_id);`);
  await api.sql(`CREATE INDEX IF NOT EXISTS ${MP_TABLE}__group_id_hash ON ${MP_TABLE} USING hash (group_id);`);
  await api.sql(`CREATE INDEX IF NOT EXISTS ${MP_TABLE}__group_id_btree ON ${MP_TABLE} USING btree (group_id);`);
  await api.sql(`CREATE INDEX IF NOT EXISTS ${MP_TABLE}__insert_category_hash ON ${MP_TABLE} USING hash (insert_category);`);
  await api.sql(`CREATE INDEX IF NOT EXISTS ${MP_TABLE}__insert_category_btree ON ${MP_TABLE} USING btree (insert_category);`);
};

export const down = async ({
  SCHEMA = DEFAULT_SCHEMA, MP_TABLE = DEFAULT_MP_TABLE, GRAPH_TABLE = DEFAULT_GRAPH_TABLE,
  trigger = Trigger({
    mpTableName: MP_TABLE,
    graphTableName: GRAPH_TABLE,
    id_type: DEFAULT_ID_TYPE,
    iteratorInsertBegin: ``,
    iteratorInsertEnd: '',
    groupInsert: '0',
    iteratorDeleteBegin: ``,
    iteratorDeleteEnd: '',
    groupDelete: '0',
  }),
} = {}) => {
  await api.sql(trigger.downTriggerDelete());
  await api.sql(trigger.downTriggerInsert());
  await api.sql(trigger.downFunctionInsertNode());
  await api.sql(trigger.downFunctionDeleteNode());
  await downPerms({ SCHEMA, MP_TABLE, GRAPH_TABLE, api });
  await downRels({ SCHEMA, MP_TABLE, GRAPH_TABLE, api });
  await downTable({ SCHEMA, MP_TABLE, api });
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
    DROP TABLE ${SCHEMA}."${GRAPH_TABLE}" CASCADE;
  `);
};
