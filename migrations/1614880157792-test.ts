import { HasuraApi } from '@deepcase/hasura/api';
import { sql } from '@deepcase/hasura/sql';
import { Trigger } from '../trigger';

const api = new HasuraApi({
  path: process.env.MIGRATIONS_HASURA_PATH,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const SCHEMA = process.env.MIGRATIONS_SCHEMA || 'public';
const MP_TABLE = process.env.MIGRATIONS_MP_TABLE || 'mp_example__nodes__mp';
const GRAPH_TABLE = process.env.MIGRATIONS_GRAPH_TABLE || 'mp_example__nodes';

const trigger = Trigger({
  mpTableName: MP_TABLE,
  graphTableName: GRAPH_TABLE,
});

export const up = async () => {
  await api.sql(sql`
    CREATE TABLE ${SCHEMA}."${GRAPH_TABLE}" (id integer, from_id integer, to_id integer, type_id integer);
    CREATE SEQUENCE nodes_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
    ALTER SEQUENCE nodes_id_seq OWNED BY ${SCHEMA}."${GRAPH_TABLE}".id;
    ALTER TABLE ONLY ${SCHEMA}."${GRAPH_TABLE}" ALTER COLUMN id SET DEFAULT nextval('nodes_id_seq'::regclass);
  `);
  await api.sql(sql`
    CREATE TABLE ${SCHEMA}."${MP_TABLE}" (id integer,item_id integer,path_item_id integer,path_item_depth integer,root_id integer,position_id text DEFAULT ${SCHEMA}.gen_random_uuid());
    CREATE SEQUENCE ${SCHEMA}.${MP_TABLE}_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
    ALTER SEQUENCE ${SCHEMA}.${MP_TABLE}_id_seq OWNED BY ${SCHEMA}.${MP_TABLE}.id;
    ALTER TABLE ONLY ${SCHEMA}.${MP_TABLE} ALTER COLUMN id SET DEFAULT nextval('${SCHEMA}.${MP_TABLE}_id_seq'::regclass);
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
  await api.query({
    type: 'track_table',
    args: {
      schema: SCHEMA,
      name: MP_TABLE,
    },
  });
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
  await api.query({
    type: 'create_array_relationship',
    args: {
      table: GRAPH_TABLE,
      name: '_by_item',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: MP_TABLE,
          },
          column_mapping: {
            id: 'item_id',
          },
        },
      },
    },
  });

  await api.query({
    type: 'create_array_relationship',
    args: {
      table: GRAPH_TABLE,
      name: '_by_path_item',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: MP_TABLE,
          },
          column_mapping: {
            id: 'path_item_id',
          },
        },
      },
    },
  });

  await api.query({
    type: 'create_array_relationship',
    args: {
      table: GRAPH_TABLE,
      name: '_by_root',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: MP_TABLE,
          },
          column_mapping: {
            id: 'root_id',
          },
        },
      },
    },
  });

  await api.query({
    type: 'create_object_relationship',
    args: {
      table: MP_TABLE,
      name: 'item',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: GRAPH_TABLE,
          },
          column_mapping: {
            item_id: 'id',
          },
        },
      },
    },
  });

  await api.query({
    type: 'create_object_relationship',
    args: {
      table: MP_TABLE,
      name: 'path_item',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: GRAPH_TABLE,
          },
          column_mapping: {
            path_item_id: 'id',
          },
        },
      },
    },
  });

  await api.query({
    type: 'create_object_relationship',
    args: {
      table: MP_TABLE,
      name: 'root',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: GRAPH_TABLE,
          },
          column_mapping: {
            root_id: 'id',
          },
        },
      },
    },
  });

  await api.query({
    type: 'create_array_relationship',
    args: {
      table: MP_TABLE,
      name: 'by_item',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: MP_TABLE,
          },
          column_mapping: {
            item_id: 'item_id',
          },
        },
      },
    },
  });

  await api.query({
    type: 'create_array_relationship',
    args: {
      table: MP_TABLE,
      name: 'by_path_item',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: MP_TABLE,
          },
          column_mapping: {
            path_item_id: 'path_item_id',
          },
        },
      },
    },
  });

  await api.query({
    type: 'create_array_relationship',
    args: {
      table: MP_TABLE,
      name: 'by_position',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: MP_TABLE,
          },
          column_mapping: {
            position_id: 'position_id',
          },
        },
      },
    },
  });

  await api.query({
    type: 'create_array_relationship',
    args: {
      table: MP_TABLE,
      name: 'by_root',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: MP_TABLE,
          },
          column_mapping: {
            root_id: 'root_id',
          },
        },
      },
    },
  });
  await api.sql(trigger.upFunctionIsRoot());
  await api.sql(trigger.upFunctionWillRoot());
  await api.sql(trigger.upFunctionInsertNode());
  await api.sql(trigger.upFunctionDeleteNode());
  await api.sql(trigger.upTriggerDelete());
  await api.sql(trigger.upTriggerInsert());
};

export const down = async () => {
  await api.sql(trigger.downTriggerDelete());
  await api.sql(trigger.downTriggerInsert());
  await api.sql(trigger.downFunctionInsertNode());
  await api.sql(trigger.downFunctionDeleteNode());
  await api.sql(trigger.downFunctionIsRoot());
  await api.sql(trigger.downFunctionWillRoot());
  await api.query({
    type: 'drop_relationship',
    args: {
      table: GRAPH_TABLE,
      relationship: '_by_item',
    },
  });
  await api.query({
    type: 'drop_relationship',
    args: {
      table: GRAPH_TABLE,
      relationship: '_by_path_item',
    },
  });
  await api.query({
    type: 'drop_relationship',
    args: {
      table: GRAPH_TABLE,
      relationship: '_by_root',
    },
  });
  await api.query({
    type: 'drop_relationship',
    args: {
      table: MP_TABLE,
      relationship: 'item',
    },
  });
  await api.query({
    type: 'drop_relationship',
    args: {
      table: MP_TABLE,
      relationship: 'path_item',
    },
  });
  await api.query({
    type: 'drop_relationship',
    args: {
      table: MP_TABLE,
      relationship: 'root',
    },
  });
  await api.query({
    type: 'drop_relationship',
    args: {
      table: MP_TABLE,
      relationship: 'by_item',
    },
  });
  await api.query({
    type: 'drop_relationship',
    args: {
      table: MP_TABLE,
      relationship: 'by_path_item',
    },
  });
  await api.query({
    type: 'drop_relationship',
    args: {
      table: MP_TABLE,
      relationship: 'by_position',
    },
  });
  await api.query({
    type: 'drop_relationship',
    args: {
      table: MP_TABLE,
      relationship: 'by_root',
    },
  });

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
