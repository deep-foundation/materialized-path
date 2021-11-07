import { generateApolloClient } from '@deep-foundation/hasura/client';

export const client = generateApolloClient({
  client: 'materialized-path-test',
  path: `${process.env.HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.HASURA_SSL,
  secret: process.env.HASURA_SECRET,
  ws: false,
});
