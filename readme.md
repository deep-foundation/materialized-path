# deepcase materialized-path

[![npm version](https://badge.fury.io/js/%40deepcase%2Fmaterialized-path.svg)](https://badge.fury.io/js/%40deepcase%2Fmaterialized-path) 
[![develop deepcase](https://badgen.net/badge/develop/deepcase)](https://github.com/deepcase/deepcase)

## install

- Before all create `.env` file. (optional)
  ```sh
  HASURA_PATH='localhost:8080'
  HASURA_SSL=0
  HASURA_SECRET='myadminsecretkey'

  MIGRATIONS_HASURA_PATH='localhost:8080'
  MIGRATIONS_HASURA_SSL=0
  MIGRATIONS_HASURA_SECRET='myadminsecretkey'

  MIGRATIONS_SCHEMA='public'
  MIGRATIONS_MP_TABLE='mp_example__nodes__mp'
  MIGRATIONS_GRAPH_TABLE='mp_example__nodes'
  MIGRATIONS_ID_TYPE_GQL='Int'
  MIGRATIONS_ID_TYPE_SQL='integer'
  ```
- Optional for tests delay
  ```sh
  DELAY=0
  ```
- Unmigrate previous test tables, migrate again
  ```
  npm run unmigrate && npm run migrate && npm run test
  ```

## test
```
npm run test
```