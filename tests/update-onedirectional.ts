require('dotenv').config();

import Debug from 'debug';
import { gql } from 'apollo-boost';
import Chance from 'chance';
import { check, checkManual } from '../check.js';
import { client } from '../client.js';
import fs from 'fs';
import { GRAPH_TABLE, ID_TYPE, MP_TABLE, beforeAllHandler, prepare, test10, test11, test12, test13, test14, test8, test9, testDeeplinksDemoTree, testMinus1, testMinus2, testMinus3, testMinus4, testMinus5, testMinus7, testMultiparentalTree, testMultipleWays, testPlus1, testPlus2, testPlus3, testPlus4, testPlus5, testPlus7, testRecursive, testRecursiveLong, testRecursiveSameRoot, testtree } from '../imports/onedirectional.js';

const debug = Debug('materialized-path:test');

const DELAY = +process.env.DELAY || 0;
const delay = time => new Promise(res => setTimeout(res, time));

const itDelay = () => {
  if (DELAY) {
    (it)('delay', async () => {
      await delay(DELAY);
    });
  }
};

export const updateNode = async (linkId: number, fromId: number, toId: number) => {
  const result: any = await client.mutate({ mutation: gql`mutation InsertNode($linkId: ${ID_TYPE}, $fromId: ${ID_TYPE} $toId: ${ID_TYPE}) {
    update_links: update_${GRAPH_TABLE}(where: { id: { _eq: $linkId } }, _set: { from_id: $fromId, to_id: $toId }) { returning { id } }
  }`, variables: { linkId, fromId, toId } });
  if (result?.errors) {
    console.error('updateNode', linkId);
    throw result?.errors;
  }
  const id = result?.data?.update_links?.returning?.[0]?.id;
  debug(`update node #${id} to #${fromId}-#${toId}`);
  return id;
};

beforeAll(beforeAllHandler); 
(it)('prepare', prepare);

it('+2 update b', testPlus2(true, async ({ a, b, c }, type_id) => {
  await updateNode(c, b, a);
  await checkManual([
    [a,0,0,type_id,[[b,b],[b,c],[b,a]]],
    [b,0,0,type_id,[[b,b]]],
    [c,b,a,type_id,[[b,b],[b,c]]],
  ], type_id, GRAPH_TABLE, MP_TABLE);
}));
it('+5 update y', testPlus5(true, async ({ a, b, c, d, e, x, y }, type_id) => {
  await updateNode(y, b, x);
  await checkManual([
    [a,0,0,type_id,[[a,a]]],
    [b,0,0,type_id,[[a,a],[a,c],[a,b]]],
    [c,a,b,type_id,[[a,a],[a,c]]],
    [d,0,0,type_id,[[a,a],[a,c],[a,b],[a,e],[a,d]]],
    [e,b,d,type_id,[[a,a],[a,c],[a,b],[a,e]]],
    [x,0,0,type_id,[[a,a],[a,c],[a,b],[a,y],[a,x]]],
    [y,b,x,type_id,[[a,a],[a,c],[a,b],[a,y]]],
  ], type_id, GRAPH_TABLE, MP_TABLE);
}));