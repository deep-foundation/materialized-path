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

export const insertNode = async (type_id: number, dir: string, idType: string = ID_TYPE) => {
  const result: any = await client.mutate({ mutation: gql`mutation InsertNode($type_id: ${idType}, $dir: String) {
    insert_links: insert_${GRAPH_TABLE}(objects: { type_id: $type_id, dir: $dir }) { returning { id } }
  }`, variables: { type_id, dir } });
  if (result?.errors) {
    console.error('insertNode', type_id);
    throw result?.errors;
  }
  const id = result?.data?.insert_links?.returning?.[0]?.id;
  debug(`insert node #${id}`);
  return id;
};
export const insertNodes = async (nodes) => {
  const result: any = await client.mutate({ mutation: gql`mutation InsertNodes($objects: [${GRAPH_TABLE}_insert_input!]!) {
    insert_links: insert_${GRAPH_TABLE}(objects: $objects) { returning { id } }
  }`, variables: { objects: nodes } });
  if (result?.errors) {
    console.error('insertNodes', nodes);
    throw result?.errors;
  }
  const returning = result?.data?.insert_links?.returning || [];
  const ids = returning.map(({id}) => id);
  debug(`insert nodes ${ids.length}`);
  return ids;
};
export const insertLink = async (fromId: number, toId: number, type_id: number, dir: string, idType: string = ID_TYPE) => {
  const result: any = await client.mutate({ mutation: gql`mutation InsertLink($fromId: ${idType}, $toId: ${idType}, $type_id: ${idType}, $dir: String) {
    insert_links: insert_${GRAPH_TABLE}(objects: { from_id: $fromId, to_id: $toId, type_id: $type_id, dir: $dir }) { returning { id } }
  }`, variables: { fromId, toId, type_id, dir } });
  if (result?.errors) {
    console.error('insertNodes', { fromId, toId, type_id });
    throw result?.errors;
  }
  const id = result?.data?.insert_links?.returning?.[0]?.id;
  debug(`insert link #${id} (#${fromId} -> #${toId})`);
  return id;
};
export const clear = async (type_id: number, idType: string = ID_TYPE) => {
  const result: any = await client.mutate({ mutation: gql`mutation Clear($type_id: ${idType}) {
    delete_links__mp: delete_${MP_TABLE}(where: { item: { type_id: { _eq: $type_id } } }) { affected_rows }
    delete_links: delete_${GRAPH_TABLE}(where: { type_id: { _eq: $type_id } }) { affected_rows }
  }`, variables: { type_id } });
  if (result?.errors) {
    console.error('clear', { type_id });
    throw result?.errors;
  }
  debug(`clear type_id #${type_id}`);
};
export const deleteNode = async (id: number, idType: string = ID_TYPE) => {
  const result: any = await client.mutate({ mutation: gql`mutation DeleteNode($id: ${idType}) {
    delete_links: delete_${GRAPH_TABLE}(where: { id: { _eq: $id } }) { returning { id } }
  }`, variables: { id } });
  if (result?.errors) {
    console.error('deleteNode', { id });
    throw result?.errors;
  }
  debug(`delete node #${id}`);
  return result?.data?.delete_links?.returning?.[0]?.id;
};

export const findNoParent = async (notId: number, type_id: number, idType: string = ID_TYPE) => {
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

export const countMp = async () => {
  const result = await client.query({ query: gql`query COUNT_MP {
    mp_example__links__mp_aggregate {
      aggregate {
        count
      }
    }
  }` });
  return result?.data?.mp_example__links__mp_aggregate?.aggregate?.count;
};

export let type_id;

export const beforeAllHandler = async () => {
  if (type_id) {
    await clear(type_id);
    await deleteNode(type_id);
  }
  if (global.jest) jest.setTimeout(1000000);
}; 
export const prepare = async () => {
  const ids = await insertNodes({});
  type_id = ids[0];
  debug('prepare', ids);
  return type_id;
};
export const testPlus15 = (needCheck = true) => async () => {
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
  if (needCheck) await checkManual([
    [a,0,0,type_id,[[a,a]]],
    [b,0,0,type_id,[[a,a],[a,c],[a,b]]],
    [c,b,a,type_id,[[a,a],[a,c]]],
    [d,0,0,type_id,[[a,a],[a,c],[a,b],[a,e],[a,d],[a,a],[a,y],[a,d]]],
    [e,b,d,type_id,[[a,a],[a,c],[a,b],[a,e]]],
    [y,d,a,type_id,[[a,a],[a,y]]],
    [f,0,0,type_id,[[f,f]]],
    [g,b,f,type_id,[[g,g]]],
  ], type_id, GRAPH_TABLE, MP_TABLE);
};
export const testMinus15 = (needCheck = true) => async () => {
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
  if (needCheck) await checkManual([
    [a,0,0,type_id,[[a,a]]],
    [b,0,0,type_id,[[a,a],[a,c],[a,b]]],
    [c,b,a,type_id,[[a,a],[a,c]]],
    [d,0,0,type_id,[[a,a],[a,c],[a,b],[a,e],[a,d]]],
    [e,b,d,type_id,[[a,a],[a,c],[a,b],[a,e]]],
    [f,0,0,type_id,[[f,f]]],
    [g,b,f,type_id,[[g,g]]],
  ], type_id, GRAPH_TABLE, MP_TABLE);
};
export const testRecursive = (needCheck = true) => async () => {
  debug('recursive');
  await clear(type_id);
  const a = await insertNode(type_id, 'node');
  const b = await insertNode(type_id, 'node');
  const c = await insertLink(b, a, type_id, 'down');
  let errored = false;
  try {
    const d = await insertLink(a, b, type_id, 'down');
  } catch(error) {
    errored = true;
  }
  if (!errored) throw new Error('Recursion error not exists');
};
export const testRecursiveSameRoot = (needCheck = true) => async () => {
  debug('recursive');
  await clear(type_id);
  const r = await insertNode(type_id, 'node');
  const a = await insertNode(type_id, 'node');
  const b = await insertNode(type_id, 'node');
  const x = await insertLink(r, a, type_id, 'down');
  const y = await insertLink(r, b, type_id, 'down');
  const c = await insertLink(b, a, type_id, 'down');
  let errored = false;
  try {
    const d = await insertLink(a, b, type_id, 'down');
  } catch(error) {
    errored = true;
  }
  if (!errored) throw new Error('Recursion error not exists');
};
export const testSeparation1 = (needCheck = true) => async () => {
  debug('testSeparation1');
  await clear(type_id);
  const a = await insertNode(type_id, 'node');
  const b = await insertNode(type_id, 'node');
  const c = await insertNode(type_id, 'node');
  const d = await insertNode(type_id, 'node');
  const e = await insertNode(type_id, 'node');
  const x = await insertLink(a, b, type_id, 'down');
  const y = await insertLink(b, c, type_id, 'down');
  const z = await insertLink(c, d, type_id, 'down');
  const w = await insertLink(d, e, type_id, 'down');
  if (needCheck) await checkManual([
    [a,0,0,type_id,[[a,a]]],
    [b,0,0,type_id,[[a,a],[a,x],[a,b]]],
    [c,0,0,type_id,[[a,a],[a,x],[a,b],[a,y],[a,c]]],
    [d,0,0,type_id,[[a,a],[a,x],[a,b],[a,y],[a,c],[a,z],[a,d]]],
    [e,0,0,type_id,[[a,a],[a,x],[a,b],[a,y],[a,c],[a,z],[a,d],[a,w],[a,e]]],
    [x,a,b,type_id,[[a,a],[a,x]]],
    [y,b,c,type_id,[[a,a],[a,x],[a,b],[a,y]]],
    [z,c,d,type_id,[[a,a],[a,x],[a,b],[a,y],[a,c],[a,z]]],
    [w,d,e,type_id,[[a,a],[a,x],[a,b],[a,y],[a,c],[a,z],[a,d],[a,w]]],
  ], type_id, GRAPH_TABLE, MP_TABLE);
};
export const testSeparation2 = (needCheck = true) => async () => {
  debug('testSeparation2');
  await clear(type_id);
  const a = await insertNode(type_id, 'node');
  const b = await insertNode(type_id, 'node');
  const c = await insertNode(type_id, 'node'); // -
  const d = await insertNode(type_id, 'node'); // |
  const e = await insertNode(type_id, 'node'); // |
  const x = await insertLink(a, b, type_id, 'down');
  const y = await insertLink(b, c, type_id, 'down'); // -
  const z = await insertLink(c, d, type_id, 'down'); // |
  const w = await insertLink(d, e, type_id, 'down'); // |
  await deleteNode(y); // -
  if (needCheck) await checkManual([
    [a,0,0,type_id,[[a,a]]],
    [b,0,0,type_id,[[a,a],[a,x],[a,b]]],
    [c,0,0,type_id,[[c,c]]],
    [d,0,0,type_id,[[c,c],[c,z],[c,d]]],
    [e,0,0,type_id,[[c,c],[c,z],[c,d],[c,w],[c,e]]],
    [x,a,b,type_id,[[a,a],[a,x]]],
    [z,c,d,type_id,[[c,c],[c,z]]],
    [w,d,e,type_id,[[c,c],[c,z],[c,d],[c,w]]],
  ], type_id, GRAPH_TABLE, MP_TABLE);
};
