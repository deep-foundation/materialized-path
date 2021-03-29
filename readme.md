# deepcase materialized-path

[![npm version](https://badge.fury.io/js/%40deepcase%2Fmaterialized-path.svg)](https://badge.fury.io/js/%40deepcase%2Fmaterialized-path) 
[![develop deepcase](https://badgen.net/badge/develop/deepcase)](https://github.com/deepcase/deepcase)

## install

- Before all create `.env` file. (optional)
  ```sh
  HASURA_PATH='localhost:8080'
  HASURA_SSL=0
  HASURA_SECRET='myadminsecretkey'
  ```
- Optional for tests delay
  ```sh
  DELAY=0
  ```
- Unmigrate previous test tables, migrate again
  ```
  # on gitpod
  npm run gitpod-unmigrate && npm run gitpod-migrate && npm run gitpod-test
  # locally
  npm run local-unmigrate && npm run local-migrate && npm run local-test
  ```

## test
```
# on gitpod
npm run gitpod-test
# locally
npm run local-test
```