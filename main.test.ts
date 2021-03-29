require('dotenv').config();

import Debug from 'debug';
import { gql } from 'apollo-boost';
import Chance from 'chance';
import { check } from './check';
import { client } from './client';

const chance = new Chance();
const debug = Debug('deepcase:materialized-path:test');

const SCHEMA = process.env.MIGRATIONS_SCHEMA || 'public';
const MP_TABLE = process.env.MIGRATIONS_MP_TABLE || 'mp_example__nodes__mp';
const GRAPH_TABLE = process.env.MIGRATIONS_GRAPH_TABLE || 'mp_example__nodes';

const DELAY = +process.env.DELAY || 0;
const delay = time => new Promise(res => setTimeout(res, time));

const itDelay = () => {
  if (DELAY) {
    it('delay', async () => {
      await delay(DELAY);
    });
  }
};

const insertNode = async (type_id: number) => {
  const result = await client.mutate({ mutation: gql`mutation InsertNode($type_id: Int) {
    insert_nodes: insert_${GRAPH_TABLE}(objects: { type_id: $type_id }) { returning { id } }
  }`, variables: { type_id } });
  if (result?.errors) throw result?.errors;
  const id = result?.data?.insert_nodes?.returning?.[0]?.id;
  debug(`insert node #${id}`);
  return id;
};
const insertNodes = async (nodes) => {
  const result = await client.mutate({ mutation: gql`mutation InsertNodes($objects: [${GRAPH_TABLE}_insert_input!]!) {
    insert_nodes: insert_${GRAPH_TABLE}(objects: $objects) { returning { id } }
  }`, variables: { objects: nodes } });
  if (result?.errors) throw result?.errors;
  const returning = result?.data?.insert_nodes?.returning || [];
  const ids = returning.map(({id}) => id);
  debug(`insert nodes ${ids.length}`);
  return ids;
};
const insertLink = async (fromId: number, toId: number, type_id: number) => {
  const result = await client.mutate({ mutation: gql`mutation InsertLink($fromId: Int, $toId: Int, $type_id: Int) {
    insert_nodes: insert_${GRAPH_TABLE}(objects: { from_id: $fromId, to_id: $toId, type_id: $type_id }) { returning { id } }
  }`, variables: { fromId, toId, type_id } });
  if (result?.errors) throw result?.errors;
  const id = result?.data?.insert_nodes?.returning?.[0]?.id;
  debug(`insert link #${id} (#${fromId} -> #${toId})`);
  return id;
};
const clear = async (type_id: number) => {
  const result = await client.mutate({ mutation: gql`mutation Clear($type_id: Int) {
    delete_nodes__mp: delete_${MP_TABLE}(where: { item: { type_id: { _eq: $type_id } } }) { affected_rows }
    delete_nodes: delete_${GRAPH_TABLE}(where: { type_id: { _eq: $type_id } }) { affected_rows }
  }`, variables: { type_id } });
  if (result?.errors) throw result?.errors;
  debug(`clear type_id #${type_id}`);
};
const deleteNode = async (id: number) => {
  const result = await client.mutate({ mutation: gql`mutation DeleteNode($id: Int) {
    delete_nodes: delete_${GRAPH_TABLE}(where: { id: { _eq: $id } }) { returning { id } }
  }`, variables: { id } });
  if (result?.errors) throw result?.errors;
  debug(`delete node #${id}`);
  return result?.data?.delete_nodes?.returning?.[0]?.id;
};

const generateTree = (initialId, count = 1000) => {
  let i = initialId + 1;
  const paths = { [initialId]: [initialId] };
  const array: any[] = [{ id: initialId }];
  const nodes = [...array];
  // const variants = [['node', 'link'], [5, 1]];
  for (let c = 0; c < count; c++) {
    const s = chance.integer({ min: 0, max: nodes.length - 1 });
    // const v = chance.weighted(...variants);
    const n = { id: i + 0 };
    const l = { id: i + 1, from_id: nodes[s].id, to_id: i + 0 };
    array.push(n, l);
    nodes.push(n);
    paths[i + 0] = paths[nodes[s].id] ? [...paths[nodes[s].id], nodes[s].id, i + 0] : [nodes[s].id, i + 0];
    i = i + 2;
  }
  array.shift();
  return { array, paths };
};

const findNoParent = async (notId: number, type_id: number) => {
  const result = await client.query({ query: gql`query FIND_NO_PARENT($notId: Int, $type_id: Int) {
    nodes: ${GRAPH_TABLE}(where: {
      from_id: { _is_null: true },
      to_id: { _is_null: true },
      _not: { _by_path_item: { item_id: {_eq: $notId} } }
    }) { id }
  }`, variables: { notId, type_id } });
  debug(`findNoParent notId #${notId} (${(result?.data?.nodes || []).length})`);
  return { nodes: result?.data?.nodes || [] };
};

const generateMultiparentalTree = async (array, nodesHash, count = 100) => {
  const nodes = array.filter(a => !a.from_id && !a.to_id);
  let founded = 0;
  let skipped = 0;
  for (let i = 0; i < count; i++) {
    const s = chance.integer({ min: 0, max: nodes.length - 1 });
    const sn = nodes[s];
    const { nodes: possibles } = await findNoParent(sn.id, type_id);
    if (possibles.length) {
      const t = chance.integer({ min: 0, max: possibles.length - 1 });
      const tn = possibles[t];
      debug(`possible ${sn.id} => ${tn.id}`);
      if (sn && tn) {
        const id = await insertLink(sn.id, tn.id, type_id);
        nodesHash[id] = id;
        founded++;
      }
    } else {
      debug(`!possibles #${sn.id}`);
      skipped++;
    }
  }
  debug(`multiparental tree founded: ${founded}, skipped: ${skipped}`);
};

let type_id;

beforeAll(async () => {
  jest.setTimeout(1000000);
}); 
afterAll(async () => {
  await clear(type_id);
  await deleteNode(type_id);
});
it('prepare', async () => {
  const ids = await insertNodes({});
  type_id = ids[0];
  debug('prepare', ids);
});

it('+1', async () => {
  await clear(type_id);
  const a = await insertNode(type_id);
  const b = await insertNode(type_id);
  await check({ a, b }, type_id);
});
itDelay();
it('-1', async () => {
  await clear(type_id);
  const a = await insertNode(type_id);
  const b = await insertNode(type_id);
  await deleteNode(a);
  await check({ a, b }, type_id);
});
itDelay();
it('+2', async () => {
  await clear(type_id);
  const a = await insertNode(type_id);
  const b = await insertNode(type_id);
  const c = await insertLink(a, b, type_id);
  await check({ a, b, c }, type_id);
});
itDelay();
it('-2', async () => {
  await clear(type_id);
  const a = await insertNode(type_id);
  const b = await insertNode(type_id);
  const c = await insertLink(a, b, type_id);
  await deleteNode(c);
  await check({ a, b, c }, type_id);
});
itDelay();
it('+3', async () => {
  await clear(type_id);
  const a = await insertNode(type_id);
  const b = await insertNode(type_id);
  const c = await insertLink(a, b, type_id);
  const d = await insertNode(type_id);
  const e = await insertLink(b, d, type_id);
  await check({ a, b, c, d, e }, type_id);
});
itDelay();
it('-3', async () => {
  await clear(type_id);
  const a = await insertNode(type_id);
  const b = await insertNode(type_id);
  const c = await insertLink(a, b, type_id);
  const d = await insertNode(type_id);
  const e = await insertLink(b, d, type_id);
  await deleteNode(e);
  await check({ a, b, c, d, e }, type_id);
});
itDelay();
it('+4', async () => {
  await clear(type_id);
  const a = await insertNode(type_id);
  const b = await insertNode(type_id);
  const c = await insertLink(a, b, type_id);
  const d = await insertNode(type_id);
  const e = await insertLink(b, d, type_id);
  const x = await insertNode(type_id);
  const y = await insertLink(x, a, type_id);
  await check({ a, b, c, d, e, x, y }, type_id);
});
itDelay();
it('-4', async () => {
  await clear(type_id);
  const a = await insertNode(type_id);
  const b = await insertNode(type_id);
  const c = await insertLink(a, b, type_id);
  const d = await insertNode(type_id);
  const e = await insertLink(b, d, type_id);
  const x = await insertNode(type_id);
  const y = await insertLink(x, a, type_id);
  await deleteNode(y);
  await check({ a, b, c, d, e, x, y }, type_id);
});
itDelay();
it('+5', async () => {
  await clear(type_id);
  const a = await insertNode(type_id);
  const b = await insertNode(type_id);
  const c = await insertLink(a, b, type_id);
  const d = await insertNode(type_id);
  const e = await insertLink(b, d, type_id);
  const x = await insertNode(type_id);
  const y = await insertLink(x, b, type_id);
  await check({ a, b, c, d, e, x, y }, type_id);
});
itDelay();
it('-5', async () => {
  await clear(type_id);
  const a = await insertNode(type_id);
  const b = await insertNode(type_id);
  const c = await insertLink(a, b, type_id);
  const d = await insertNode(type_id);
  const e = await insertLink(b, d, type_id);
  const x = await insertNode(type_id);
  const y = await insertLink(x, b, type_id);
  await deleteNode(y);
  await check({ a, b, c, d, e, x, y }, type_id);
});
itDelay();
it('+7', async () => {
  await clear(type_id);
  const a = await insertNode(type_id);
  const b = await insertNode(type_id);
  const c = await insertLink(a, b, type_id);
  const d = await insertNode(type_id);
  const e = await insertLink(b, d, type_id);
  const y = await insertLink(a, d, type_id);
  await check({ a, b, c, d, e, y }, type_id);
});
itDelay();
it('-7', async () => {
  await clear(type_id);
  const a = await insertNode(type_id);
  const b = await insertNode(type_id);
  const c = await insertLink(a, b, type_id);
  const d = await insertNode(type_id);
  const e = await insertLink(b, d, type_id);
  const y = await insertLink(a, d, type_id);
  await deleteNode(y);
  await check({ a, b, c, d, e, y }, type_id);
});
itDelay();
it('tree', async () => {
  await clear(type_id);
  const a = await insertNode(type_id);
  const { array } = generateTree(a, 100);
  const ids = await insertNodes(array.map(({ id, ...a }) => ({ ...a, type_id })));
  const ns = {};
  for (let d = 0; d < ids.length; d++) ns[ids[d]] = ids[d];
  await check({ a, ...ns }, type_id);
});
itDelay();
it('multiparental tree', async () => {
  await clear(type_id);
  const a = await insertNode(type_id);
  const { array } = generateTree(a, 500);
  const ids = await insertNodes(array.map(({ id, ...a }) => ({ ...a, type_id })));
  const ns = {};
  for (let d = 0; d < ids.length; d++) ns[ids[d]] = ids[d];
  await generateMultiparentalTree(array, ns, 20);
  await check({ a, ...ns }, type_id);
});