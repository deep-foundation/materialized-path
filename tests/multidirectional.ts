require('dotenv').config();

import Debug from 'debug';
import { gql } from 'apollo-boost';
import Chance from 'chance';
import { check, checkManual } from '../check';
import { client } from '../client';
import fs from 'fs';

const chance = new Chance();
const debug = Debug('materialized-path:test');

const SCHEMA = process.env.MIGRATIONS_SCHEMA || 'public';
const MP_TABLE = process.env.MIGRATIONS_MP_TABLE || 'mp_example__links__mp_md';
const GRAPH_TABLE = process.env.MIGRATIONS_GRAPH_TABLE || 'mp_example__links_md';
const ID_TYPE = process.env.MIGRATIONS_ID_TYPE_GQL || 'Int';

const DELAY = +process.env.DELAY || 0;
const delay = time => new Promise(res => setTimeout(res, time));

const itDelay = () => {
  if (DELAY) {
    (it)('delay', async () => {
      await delay(DELAY);
    });
  }
};

const insertNode = async (type_id: number, dir: string, idType: string = ID_TYPE) => {
  const result: any = await client.mutate({ mutation: gql`mutation InsertNode($type_id: ${idType}, $dir: String) {
    insert_links: insert_${GRAPH_TABLE}(objects: { type_id: $type_id, dir: $dir }) { returning { id } }
  }`, variables: { type_id, dir } });
  if (result?.errors) {
    throw result?.errors;
    console.error(result?.errors);
  }
  const id = result?.data?.insert_links?.returning?.[0]?.id;
  debug(`insert node #${id}`);
  return id;
};
const insertNodes = async (nodes) => {
  const result: any = await client.mutate({ mutation: gql`mutation InsertNodes($objects: [${GRAPH_TABLE}_insert_input!]!) {
    insert_links: insert_${GRAPH_TABLE}(objects: $objects) { returning { id } }
  }`, variables: { objects: nodes } });
  if (result?.errors) {
    throw result?.errors;
    console.error(result?.errors);
  }
  const returning = result?.data?.insert_links?.returning || [];
  const ids = returning.map(({id}) => id);
  debug(`insert nodes ${ids.length}`);
  return ids;
};
const insertLink = async (fromId: number, toId: number, type_id: number, dir: string, idType: string = ID_TYPE) => {
  const result: any = await client.mutate({ mutation: gql`mutation InsertLink($fromId: ${idType}, $toId: ${idType}, $type_id: ${idType}, $dir: String) {
    insert_links: insert_${GRAPH_TABLE}(objects: { from_id: $fromId, to_id: $toId, type_id: $type_id, dir: $dir }) { returning { id } }
  }`, variables: { fromId, toId, type_id, dir } });
  if (result?.errors) {
    throw result?.errors;
    console.error(result?.errors);
  }
  const id = result?.data?.insert_links?.returning?.[0]?.id;
  debug(`insert link #${id} (#${fromId} -> #${toId})`);
  return id;
};
const clear = async (type_id: number, idType: string = ID_TYPE) => {
  const result: any = await client.mutate({ mutation: gql`mutation Clear($type_id: ${idType}) {
    delete_links__mp: delete_${MP_TABLE}(where: { item: { type_id: { _eq: $type_id } } }) { affected_rows }
    delete_links: delete_${GRAPH_TABLE}(where: { type_id: { _eq: $type_id } }) { affected_rows }
  }`, variables: { type_id } });
  if (result?.errors) {
    throw result?.errors;
    console.error(result?.errors);
  }
  debug(`clear type_id #${type_id}`);
};
const deleteNode = async (id: number, idType: string = ID_TYPE) => {
  const result: any = await client.mutate({ mutation: gql`mutation DeleteNode($id: ${idType}) {
    delete_links: delete_${GRAPH_TABLE}(where: { id: { _eq: $id } }) { returning { id } }
  }`, variables: { id } });
  if (result?.errors) {
    throw result?.errors;
    console.error(result?.errors);
  }
  debug(`delete node #${id}`);
  return result?.data?.delete_links?.returning?.[0]?.id;
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

const findNoParent = async (notId: number, type_id: number, idType: string = ID_TYPE) => {
  const result = await client.query({ query: gql`query FIND_NO_PARENT($notId: ${idType}, $type_id: ${idType}) {
    nodes: ${GRAPH_TABLE}(where: {
      from_id: { _is_null: true },
      to_id: { _is_null: true },
      _not: { _by_path_item: { item_id: {_eq: $notId} } }
    }) { id }
  }`, variables: { notId, type_id } });
  debug(`findNoParent notId #${notId} (${(result?.data?.nodes || []).length})`);
  return { nodes: result?.data?.nodes || [] };
};

const countMp = async () => {
  const result = await client.query({ query: gql`query COUNT_MP {
    mp_example__links__mp_aggregate {
      aggregate {
        count
      }
    }
  }` });
  return result?.data?.mp_example__links__mp_aggregate?.aggregate?.count;
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
        const id = await insertLink(sn.id, tn.id, type_id, 'down');
        nodesHash[id] = id;
        founded++;
        debug(`count mp: ${await countMp()}`);
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
  await clear(type_id);
  await deleteNode(type_id);
  jest.setTimeout(1000000);
}); 
(it)('prepare', async () => {
  const ids = await insertNodes({});
  type_id = ids[0];
  debug('prepare', ids);
});
it('+15', async () => {
  debug('+15');
  await clear(type_id);
  const a = await insertNode(type_id, 'node');
  const b = await insertNode(type_id, 'up');
  const c = await insertLink(b, a, type_id, 'up');
  const d = await insertNode(type_id, 'node');
  const e = await insertLink(b, d, type_id, 'down');
  const y = await insertLink(d, a, type_id, 'up');
  const f = await insertNode(type_id, 'down');
  const g = await insertLink(b, f, type_id, 'node');
  await checkManual([
    [a,0,0,type_id,[[a,a]]],
    [b,0,0,type_id,[[a,a],[a,c],[a,b]]],
    [c,b,a,type_id,[[a,a],[a,c]]],
    [d,0,0,type_id,[[a,a],[a,c],[a,b],[a,e],[a,d],[a,a],[a,y],[a,d]]],
    [e,b,d,type_id,[[a,a],[a,c],[a,b],[a,e]]],
    [y,d,a,type_id,[[a,a],[a,y]]],
    [f,0,0,type_id,[[f,f]]],
    [g,b,f,type_id,[[g,g]]],
  ], type_id, GRAPH_TABLE, MP_TABLE);
});
itDelay();
it('-15', async () => {
  debug('-15');
  await clear(type_id);
  const a = await insertNode(type_id, 'node');
  const b = await insertNode(type_id, 'up');
  const c = await insertLink(b, a, type_id, 'up');
  const d = await insertNode(type_id, 'node');
  const e = await insertLink(b, d, type_id, 'down');
  const y = await insertLink(d, a, type_id, 'up');
  const f = await insertNode(type_id, 'down');
  const g = await insertLink(b, f, type_id, 'node');
  await deleteNode(y);
  await checkManual([
    [a,0,0,type_id,[[a,a]]],
    [b,0,0,type_id,[[a,a],[a,c],[a,b]]],
    [c,b,a,type_id,[[a,a],[a,c]]],
    [d,0,0,type_id,[[a,a],[a,c],[a,b],[a,e],[a,d]]],
    [e,b,d,type_id,[[a,a],[a,c],[a,b],[a,e]]],
    [f,0,0,type_id,[[f,f]]],
    [g,b,f,type_id,[[g,g]]],
  ], type_id, GRAPH_TABLE, MP_TABLE);
});
