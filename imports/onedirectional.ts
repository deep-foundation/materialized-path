require('dotenv').config();

import Debug from 'debug';
import { gql } from 'apollo-boost';
import Chance from 'chance';
import { check, checkManual } from '../check.js';
import { client } from '../client.js';
import fs from 'fs';

const chance = new Chance();
const debug = Debug('materialized-path:test');

export const SCHEMA = process.env.MIGRATIONS_SCHEMA || 'public';
export const MP_TABLE = process.env.MIGRATIONS_MP_TABLE || 'mp_example__links__mp';
export const GRAPH_TABLE = process.env.MIGRATIONS_GRAPH_TABLE || 'mp_example__links';
export const ID_TYPE = process.env.MIGRATIONS_ID_TYPE_GQL || 'Int';

export const insertNode = async (type_id: number, idType: string = ID_TYPE) => {
  const result: any = await client.mutate({ mutation: gql`mutation InsertNode($type_id: ${idType}) {
    insert_links: insert_${GRAPH_TABLE}(objects: { type_id: $type_id }) { returning { id } }
  }`, variables: { type_id } });
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
export const insertLink = async (fromId: number, toId: number, type_id: number, idType: string = ID_TYPE) => {
  const result: any = await client.mutate({ mutation: gql`mutation InsertLink($fromId: ${idType}, $toId: ${idType}, $type_id: ${idType}) {
    insert_links: insert_${GRAPH_TABLE}(objects: { from_id: $fromId, to_id: $toId, type_id: $type_id }) { returning { id } }
  }`, variables: { fromId, toId, type_id } });
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

export const generateTree = (initialId, count = 1000) => {
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

export const generateMultiparentalTree = async (array, nodesHash, count = 100) => {
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
        debug(`count mp: ${await countMp()}`);
      }
    } else {
      debug(`!possibles #${sn.id}`);
      skipped++;
    }
  }
  debug(`multiparental tree founded: ${founded}, skipped: ${skipped}`);
};

export let type_id;

export const beforeAllHandler = async () => {
  if (type_id) {
    await clear(type_id);
    await deleteNode(type_id);
  }
  if (global?.jest) jest.setTimeout(1000000);
  return type_id;
}; 
export const prepare = async () => {
  const ids = await insertNodes({});
  type_id = ids[0];
  debug('prepare', ids);
  return type_id;
};

export const testPlus1 = (needCheck = true, callback?: (ids: { [key:string]: number }, type_id?: number) => Promise<void>) => async () => {
  debug('+1');
  await clear(type_id);
  const a = await insertNode(type_id);
  const b = await insertNode(type_id);
  if (needCheck) await check({ a, b }, type_id);
  callback && await callback({ a, b }, type_id);
};
export const testMinus1 = (needCheck = true, callback?: (ids: { [key:string]: number }, type_id?: number) => Promise<void>) => async () => {
  debug('-1');
  await clear(type_id);
  const a = await insertNode(type_id);
  const b = await insertNode(type_id);
  await deleteNode(a);
  if (needCheck) await check({ a, b }, type_id);
  callback && await callback({ a, b }, type_id);
};
export const testPlus2 = (needCheck = true, callback?: (ids: { [key:string]: number }, type_id?: number) => Promise<void>) => async () => {
  debug('+2');
  await clear(type_id);
  const a = await insertNode(type_id);
  const b = await insertNode(type_id);
  const c = await insertLink(a, b, type_id);
  if (needCheck) await check({ a, b, c }, type_id);
  if (needCheck) await checkManual([
    [a,0,0,type_id,[[a,a]]],
    [b,0,0,type_id,[[a,a],[a,c],[a,b]]],
    [c,a,b,type_id,[[a,a],[a,c]]],
  ], type_id, GRAPH_TABLE, MP_TABLE);
  callback && await callback({ a, b, c }, type_id);
};
export const testMinus2 = (needCheck = true, callback?: (ids: { [key:string]: number }, type_id?: number) => Promise<void>) => async () => {
  debug('-2');
  await clear(type_id);
  const a = await insertNode(type_id);
  const b = await insertNode(type_id);
  const c = await insertLink(a, b, type_id);
  await deleteNode(c);
  if (needCheck) await check({ a, b, c }, type_id);
  callback && await callback({ a, b, c }, type_id);
};
export const testPlus3 = (needCheck = true, callback?: (ids: { [key:string]: number }, type_id?: number) => Promise<void>) => async () => {
  debug('+3');
  await clear(type_id);
  const a = await insertNode(type_id);
  const b = await insertNode(type_id);
  const c = await insertLink(a, b, type_id);
  const d = await insertNode(type_id);
  const e = await insertLink(b, d, type_id);
  if (needCheck) await check({ a, b, c, d, e }, type_id);
  if (needCheck) await checkManual([
    [a,0,0,type_id,[[a,a]]],
    [b,0,0,type_id,[[a,a],[a,c],[a,b]]],
    [c,a,b,type_id,[[a,a],[a,c]]],
    [d,0,0,type_id,[[a,a],[a,c],[a,b],[a,e],[a,d]]],
    [e,b,d,type_id,[[a,a],[a,c],[a,b],[a,e]]],
  ], type_id, GRAPH_TABLE, MP_TABLE);
  callback && await callback({ a, b, c, d, e }, type_id);
};
export const testMinus3 = (needCheck = true, callback?: (ids: { [key:string]: number }, type_id?: number) => Promise<void>) => async () => {
  debug('-3');
  await clear(type_id);
  const a = await insertNode(type_id);
  const b = await insertNode(type_id);
  const c = await insertLink(a, b, type_id);
  const d = await insertNode(type_id);
  const e = await insertLink(b, d, type_id);
  await deleteNode(e);
  if (needCheck) await check({ a, b, c, d, e }, type_id);
  if (needCheck) await checkManual([
    [a,0,0,type_id,[[a,a]]],
    [b,0,0,type_id,[[a,a],[a,c],[a,b]]],
    [c,a,b,type_id,[[a,a],[a,c]]],
    [d,0,0,type_id,[[d,d]]],
  ], type_id, GRAPH_TABLE, MP_TABLE);
  callback && await callback({ a, b, c, d, e }, type_id);
};
export const testPlus4 = (needCheck = true, callback?: (ids: { [key:string]: number }, type_id?: number) => Promise<void>) => async () => {
  debug('+4');
  await clear(type_id);
  const a = await insertNode(type_id);
  const b = await insertNode(type_id);
  const c = await insertLink(a, b, type_id);
  const d = await insertNode(type_id);
  const e = await insertLink(b, d, type_id);
  const x = await insertNode(type_id);
  const y = await insertLink(x, a, type_id);
  if (needCheck) await check({ a, b, c, d, e, x, y }, type_id);
  callback && await callback({ a, b, c, d, e, x, y }, type_id);
};
export const testMinus4 = (needCheck = true, callback?: (ids: { [key:string]: number }, type_id?: number) => Promise<void>) => async () => {
  debug('-4');
  await prepare();
  await clear(type_id);
  const a = await insertNode(type_id);
  const b = await insertNode(type_id);
  const c = await insertLink(a, b, type_id);
  const d = await insertNode(type_id);
  const e = await insertLink(b, d, type_id);
  const x = await insertNode(type_id);
  const y = await insertLink(x, a, type_id);
  await deleteNode(y);
  if (needCheck) await check({ a, b, c, d, e, x, y }, type_id);
  if (needCheck) await checkManual([
    [a,0,0,type_id,[[a,a]]],
    [b,0,0,type_id,[[a,a],[a,c],[a,b]]],
    [c,a,b,type_id,[[a,a],[a,c]]],
    [d,0,0,type_id,[[a,a],[a,c],[a,b],[a,e],[a,d]]],
    [e,b,d,type_id,[[a,a],[a,c],[a,b],[a,e]]],
    [x,0,0,type_id,[[x,x]]],
  ], type_id, GRAPH_TABLE, MP_TABLE);
  callback && await callback({ a, b, c, d, e, x, y }, type_id);
};
export const testPlus5 = (needCheck = true, callback?: (ids: { [key:string]: number }, type_id?: number) => Promise<void>) => async () => {
  debug('+5');
  await clear(type_id);
  const a = await insertNode(type_id);
  const b = await insertNode(type_id);
  const c = await insertLink(a, b, type_id);
  const d = await insertNode(type_id);
  const e = await insertLink(b, d, type_id);
  const x = await insertNode(type_id);
  const y = await insertLink(x, b, type_id);
  if (needCheck) await check({ a, b, c, d, e, x, y }, type_id);
  if (needCheck) await checkManual([
    [a,0,0,type_id,[[a,a]]],
    [b,0,0,type_id,[[a,a],[a,c],[a,b],[x,x],[x,y],[x,b]]],
    [c,a,b,type_id,[[a,a],[a,c]]],
    [d,0,0,type_id,[[a,a],[a,c],[a,b],[a,e],[a,d],[x,x],[x,y],[x,b],[x,e],[x,d]]],
    [e,b,d,type_id,[[a,a],[a,c],[a,b],[a,e],[x,x],[x,y],[x,b],[x,e]]],
    [x,0,0,type_id,[[x,x]]],
    [y,x,b,type_id,[[x,x],[x,y]]],
  ], type_id, GRAPH_TABLE, MP_TABLE);
  callback && await callback({ a, b, c, d, e, x, y }, type_id);
};
export const testMinus5 = (needCheck = true, callback?: (ids: { [key:string]: number }, type_id?: number) => Promise<void>) => async () => {
  debug('-5');
  await clear(type_id);
  const a = await insertNode(type_id);
  const b = await insertNode(type_id);
  const c = await insertLink(a, b, type_id);
  const d = await insertNode(type_id);
  const e = await insertLink(b, d, type_id);
  const x = await insertNode(type_id);
  const y = await insertLink(x, b, type_id);
  await deleteNode(y);
  if (needCheck) await check({ a, b, c, d, e, x, y }, type_id);
  if (needCheck) await checkManual([
    [a,0,0,type_id,[[a,a]]],
    [b,0,0,type_id,[[a,a],[a,c],[a,b]]],
    [c,a,b,type_id,[[a,a],[a,c]]],
    [d,0,0,type_id,[[a,a],[a,c],[a,b],[a,e],[a,d]]],
    [e,b,d,type_id,[[a,a],[a,c],[a,b],[a,e]]],
    [x,0,0,type_id,[[x,x]]],
  ], type_id, GRAPH_TABLE, MP_TABLE);
  callback && await callback({ a, b, c, d, e, x, y }, type_id);
};
export const testPlus7 = (needCheck = true, callback?: (ids: { [key:string]: number }, type_id?: number) => Promise<void>) => async () => {
  debug('+7');
  await clear(type_id);
  const a = await insertNode(type_id);
  const b = await insertNode(type_id);
  const c = await insertLink(a, b, type_id);
  const d = await insertNode(type_id);
  const e = await insertLink(b, d, type_id);
  const y = await insertLink(a, d, type_id);
  if (needCheck) await check({ a, b, c, d, e, y }, type_id);
  callback && await callback({ a, b, c, d, e, y }, type_id);
};
export const testMinus7 = (needCheck = true, callback?: (ids: { [key:string]: number }, type_id?: number) => Promise<void>) => async () => {
  debug('-7');
  await clear(type_id);
  const a = await insertNode(type_id);
  const b = await insertNode(type_id);
  const c = await insertLink(a, b, type_id);
  const d = await insertNode(type_id);
  const e = await insertLink(b, d, type_id);
  const y = await insertLink(a, d, type_id);
  await deleteNode(y);
  if (needCheck) await check({ a, b, c, d, e, y }, type_id);
  callback && await callback({ a, b, c, d, e, y }, type_id);
};
export const testtree = (needCheck = true, callback?: (ids: { [key:string]: number }, type_id?: number) => Promise<void>) => async () => {
  debug('tree');
  await clear(type_id);
  const a = await insertNode(type_id);
  const { array } = generateTree(a, 1000);
  const ids = await insertNodes(array.map(({ id, ...a }) => ({ ...a, type_id })));
  const ns = {};
  for (let d = 0; d < ids.length; d++) ns[ids[d]] = ids[d];
  if (needCheck) await check({ a, ...ns }, type_id);
  callback && await callback({ a, ...ns }, type_id);
};
export const testMultipleWays = (needCheck = true, callback?: (ids: { [key:string]: number }, type_id?: number) => Promise<void>) => async () => {
  debug('multiple ways');
  await clear(type_id);
  const a = await insertNode(type_id);
  const b = await insertNode(type_id);
  const c = await insertNode(type_id);
  const d = await insertNode(type_id);
  const x = await insertLink(a, b, type_id);
  const y = await insertLink(a, b, type_id);
  const r = await insertLink(a, c, type_id);
  const m = await insertLink(b, d, type_id);
  const n = await insertLink(b, d, type_id);
  const f = await insertLink(d, c, type_id);
  if (needCheck) await check({ a, b, c, d, x, y, r, m, n, f }, type_id);
  callback && await callback({ a, b, c, d, x, y, r, m, n, f }, type_id);
};
export const testMultiparentalTree = (needCheck = true, callback?: (ids: { [key:string]: number }, type_id?: number) => Promise<void>) => async () => {
  debug('multiparental tree');
  await clear(type_id);
  const a = await insertNode(type_id);
  const { array } = generateTree(a, 100);
  const ids = await insertNodes(array.map(({ id, ...a }) => ({ ...a, type_id })));
  const ns = {};
  for (let d = 0; d < ids.length; d++) ns[ids[d]] = ids[d];
  await generateMultiparentalTree(array, ns, 30);
  if (needCheck) await check({ a, ...ns }, type_id);
  callback && await callback({ a, ...ns }, type_id);
};
export const test8 = (needCheck = true, callback?: (ids: { [key:string]: number }, type_id?: number) => Promise<void>) => async () => {
  debug('8');
  await clear(type_id);
  const w = await insertNode(type_id);
  const a = w+2;
  const b = w+3;
  const c = await insertLink(a, b, type_id);
  if (needCheck) await check({ w }, type_id);
  if (needCheck) await checkManual([
    [w,0,0,type_id,[[w,w]]],
    [c,a,b,type_id,[[c,c]]],
  ], type_id, GRAPH_TABLE, MP_TABLE);
  await insertNode(type_id);
  await insertNode(type_id);
  callback && await callback({ w }, type_id);
};
export const test9 = (needCheck = true, callback?: (ids: { [key:string]: number }, type_id?: number) => Promise<void>) => async () => {
  debug('9');
  await clear(type_id);
  const w = await insertNode(type_id);
  const a = w+2;
  const b = w+3;
  const c = await insertLink(a, b, type_id);
  await insertNode(type_id);
  if (needCheck) await check({ w, c, a }, type_id);
  if (needCheck) await checkManual([
    [w,0,0,type_id,[[w,w]]],
    [c,a,b,type_id,[[a,a],[a,c]]],
    [a,0,0,type_id,[[a,a]]],
  ], type_id, GRAPH_TABLE, MP_TABLE);
  await insertNode(type_id);
  callback && await callback({ w, c, a }, type_id);
};
export const test10 = (needCheck = true, callback?: (ids: { [key:string]: number }, type_id?: number) => Promise<void>) => async () => {
  debug('10');
  await clear(type_id);
  const w = await insertNode(type_id);
  const a = w+3;
  const b = w+2;
  const c = await insertLink(a, b, type_id);
  await insertNode(type_id);
  if (needCheck) await check({ w, c, b }, type_id);
  if (needCheck) await checkManual([
    [w,0,0,type_id,[[w,w]]],
    [c,a,b,type_id,[[c,c]]],
    [b,0,0,type_id,[[c,c],[c,b]]],
  ], type_id, GRAPH_TABLE, MP_TABLE);
  await insertNode(type_id);
  callback && await callback({ w, c, b }, type_id);
};
export const test11 = (needCheck = true, callback?: (ids: { [key:string]: number }, type_id?: number) => Promise<void>) => async () => {
  debug('11');
  await clear(type_id);
  const w = await insertNode(type_id);
  const a = w+3;
  const b = w+2;
  const c = await insertLink(a, b, type_id);
  await insertNode(type_id);
  await insertNode(type_id);
  if (needCheck) await check({ w, c, b, a }, type_id);
  if (needCheck) await checkManual([
    [w,0,0,type_id,[[w,w]]],
    [c,a,b,type_id,[[a,a],[a,c]]],
    [b,0,0,type_id,[[a,a],[a,c],[a,b]]],
    [a,0,0,type_id,[[a,a]]],
  ], type_id, GRAPH_TABLE, MP_TABLE);
  callback && await callback({ w, c, b, a }, type_id);
};
export const test12 = (needCheck = true, callback?: (ids: { [key:string]: number }, type_id?: number) => Promise<void>) => async () => {
  debug('12');
  await clear(type_id);
  const w = await insertNode(type_id);
  const a = w+2;
  const b = w+3;
  const c = await insertLink(a, b, type_id);
  await insertNode(type_id);
  await insertNode(type_id);
  await deleteNode(a);
  if (needCheck) await check({ w, c, b, a }, type_id);
  if (needCheck) await checkManual([
    [w,0,0,type_id,[[w,w]]],
    [c,a,b,type_id,[[c,c]]],
    [b,0,0,type_id,[[c,c], [c,b]]],
  ], type_id, GRAPH_TABLE, MP_TABLE);
  callback && await callback({ w, c, b, a }, type_id);
};
export const test13 = (needCheck = true, callback?: (ids: { [key:string]: number }, type_id?: number) => Promise<void>) => async () => {
  debug('13');
  await clear(type_id);
  const w = await insertNode(type_id);
  const a = w+2;
  const b = w+3;
  const c = await insertLink(a, b, type_id);
  await insertNode(type_id);
  await insertNode(type_id);
  await deleteNode(a);
  await deleteNode(b);
  if (needCheck) await check({ w, c, b, a }, type_id);
  if (needCheck) await checkManual([
    [w,0,0,type_id,[[w,w]]],
    [c,a,b,type_id,[[c,c]]],
  ], type_id, GRAPH_TABLE, MP_TABLE);
  callback && await callback({ w, c, b, a }, type_id);
};
export const test14 = (needCheck = true, callback?: (ids: { [key:string]: number }, type_id?: number) => Promise<void>) => async () => {
  debug('14');
  await clear(type_id);
  const w = await insertNode(type_id);
  const a = w+3;
  const b = w+2;
  const c = await insertLink(a, b, type_id);
  await insertNode(type_id);
  await deleteNode(c);
  if (needCheck) await check({ w, c, b }, type_id);
  if (needCheck) await checkManual([
    [w,0,0,type_id,[[w,w]]],
    [b,0,0,type_id,[[b,b]]],
  ], type_id, GRAPH_TABLE, MP_TABLE);
  await insertNode(type_id);
  callback && await callback({ w, c, b }, type_id);
};
export const testDeeplinksDemoTree = (needCheck = true) => async () => {
  debug('deeplinks demo tree');
  await clear(type_id);
  const n0 = await insertNode(type_id);
  const n1 = await insertNode(type_id);
  const n2 = await insertNode(type_id);
  const n3 = await insertNode(type_id);
  const n4 = await insertNode(type_id);
  const n5 = await insertNode(type_id);
  const n6 = await insertNode(type_id);
  const l0 = await insertLink(n0, n1, type_id);
  const l1 = await insertLink(n0, n2, type_id);
  const l2 = await insertLink(n1, n3, type_id);
  const l3 = await insertLink(n1, n4, type_id);
  const l4 = await insertLink(n2, n5, type_id);
  const l5 = await insertLink(n2, n6, type_id);
  if (needCheck) await check({
    n0, n1, n2, n3, n4, n5, n6, l0, l1, l2, l3, l4, l5,
  }, type_id);
};
export const testRecursive = (needCheck = true) => async () => {
  debug('recursive');
  await clear(type_id);
  const a = await insertNode(type_id);
  const b = await insertNode(type_id);
  const c = await insertLink(b, a, type_id);
  let errored = false;
  try {
    const d = await insertLink(a, b, type_id);
  } catch(error) {
    errored = true;
  }
  if (!errored) throw new Error('Recursion error not exists');
};
export const testRecursiveSameRoot = (needCheck = true) => async () => {
  debug('recursive');
  await clear(type_id);
  const r = await insertNode(type_id);
  const a = await insertNode(type_id);
  const b = await insertNode(type_id);
  const x = await insertLink(r, a, type_id);
  const y = await insertLink(r, b, type_id);
  const c = await insertLink(b, a, type_id);
  let errored = false;
  try {
    const d = await insertLink(a, b, type_id);
  } catch(error) {
    errored = true;
  }
  if (!errored) throw new Error('Recursion error not exists');
};
export const testRecursiveLong = (needCheck = true) => async () => {
  debug('recursive');
  await clear(type_id);
  const a = await insertNode(type_id);
  const b = await insertNode(type_id);
  const c = await insertNode(type_id);
  const d = await insertNode(type_id);
  const x = await insertLink(a, b, type_id);
  const y = await insertLink(b, c, type_id);
  const z = await insertLink(c, d, type_id);
  let errored = false;
  try {
    const r = await insertLink(d, a, type_id);
  } catch(error) {
    errored = true;
  }
  if (!errored) throw new Error('Recursion error not exists');
};