import { HasuraApi } from '@deep-foundation/hasura/api';
import { Trigger } from './trigger';

const DEFAULT_SCHEMA = process.env.MIGRATIONS_SCHEMA || 'public';
const DEFAULT_MP_TABLE = process.env.MIGRATIONS_MP_TABLE || 'mp_example__links__mp';
const DEFAULT_GRAPH_TABLE = process.env.MIGRATIONS_GRAPH_TABLE || 'mp_example__links';

export const up = async ({
  SCHEMA = DEFAULT_SCHEMA, MP_TABLE = DEFAULT_MP_TABLE, GRAPH_TABLE = DEFAULT_GRAPH_TABLE, ID_FIELD = 'id', api
}: {
  SCHEMA?: string; MP_TABLE?: string; GRAPH_TABLE?: string; ID_FIELD?: string;
  api: HasuraApi;
}) => {
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
};

export const down = async ({
  SCHEMA = DEFAULT_SCHEMA, MP_TABLE = DEFAULT_MP_TABLE, GRAPH_TABLE = DEFAULT_GRAPH_TABLE, api
}: {
  SCHEMA?: string; MP_TABLE?: string; GRAPH_TABLE?: string; ID_FIELD?: string;
  api: HasuraApi;
}) => {
  await api.query({
    type: 'drop_select_permission',
    args: {
      table: MP_TABLE,
      role: 'guest',
    }
  });
  await api.query({
    type: 'drop_select_permission',
    args: {
      table: MP_TABLE,
      role: 'user',
    }
  });
};
