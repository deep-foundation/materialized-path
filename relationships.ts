import { HasuraApi } from '@deepcase/hasura/api';
import { Trigger } from './trigger';

const api = new HasuraApi({
  path: process.env.MIGRATIONS_HASURA_PATH,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const DEFAULT_SCHEMA = process.env.MIGRATIONS_SCHEMA || 'public';
const DEFAULT_MP_TABLE = process.env.MIGRATIONS_MP_TABLE || 'mp_example__links__mp';
const DEFAULT_GRAPH_TABLE = process.env.MIGRATIONS_GRAPH_TABLE || 'mp_example__links';

export const up = async ({
  SCHEMA = DEFAULT_SCHEMA, MP_TABLE = DEFAULT_MP_TABLE, GRAPH_TABLE = DEFAULT_GRAPH_TABLE
} = {}) => {
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
    type: 'create_array_relationship',
    args: {
      table: GRAPH_TABLE,
      name: '_by_group',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: MP_TABLE,
          },
          column_mapping: {
            id: 'group_id',
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
    type: 'create_object_relationship',
    args: {
      table: MP_TABLE,
      name: 'by_group',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: GRAPH_TABLE,
          },
          column_mapping: {
            group_id: 'id',
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
};

export const down = async ({
  SCHEMA = DEFAULT_SCHEMA, MP_TABLE = DEFAULT_MP_TABLE, GRAPH_TABLE = DEFAULT_GRAPH_TABLE
} = {}) => {
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
      table: GRAPH_TABLE,
      relationship: '_by_group',
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
      relationship: 'by_group',
    },
  });
  await api.query({
    type: 'drop_relationship',
    args: {
      table: MP_TABLE,
      relationship: 'by_root',
    },
  });
};
