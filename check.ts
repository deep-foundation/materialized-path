import { client } from './client';
import Debug from 'debug';
import { gql } from 'apollo-boost';
import forEach from 'lodash/forEach';
import assert from 'assert';

const debug = Debug('materialized-path:check');

const SCHEMA = process.env.MIGRATIONS_SCHEMA || 'public';
const MP_TABLE = process.env.MIGRATIONS_MP_TABLE || 'mp_example__links__mp';
const GRAPH_TABLE = process.env.MIGRATIONS_GRAPH_TABLE || 'mp_example__links';
const ID_TYPE = process.env.MIGRATIONS_ID_TYPE_GQL || 'Int';

export const fetch = async (type_id: number, idType: string = ID_TYPE, GRAPH_TABLE, MP_TABLE) => {
  const result = await client.query({ query: gql`query FETCH($type_id: ${idType}) {
    mp: ${MP_TABLE}(where: { item: { type_id: { _eq: $type_id } } }, order_by: {id: asc}) {
      id item_id path_item_depth path_item_id root_id position_id custom
      by_position(order_by: { path_item_depth: asc }) { id item_id path_item_depth path_item_id root_id position_id }
    }
    nodes: ${GRAPH_TABLE}(where: { type_id: { _eq: $type_id } }) { from_id id to_id type_id in { from_id id to_id type_id } out { from_id id to_id type_id } }
  }`, variables: { type_id } });
  return { nodes: result?.data?.nodes || [], mp: result?.data?.mp || [] };
};

interface Node {
  from_id?: number; id?: number; to_id?: number; type_id?: number;
  in: Node[]; out: Node[];
}

interface Marker {
  id: number; item_id: number; path_item_depth: number; path_item_id: number; root_id: number; position_id: string;
  by_position: Marker[];
}

export const check = async (hash: { [name:string]: number }, type_id: number) => {
  const n: any = {};
  forEach(hash, (value, key) => { n[value] = key });

  const { nodes, mp } = await fetch(type_id, ID_TYPE, GRAPH_TABLE, MP_TABLE);

  debug('checking');
  let valid = true;
  const invalid = (...args) => {
    valid = false;
    debug(...args);
  };

  if (!nodes.length) invalid(`nodes not fetched`);

  const nodesChecked: { [id: number]: boolean; } = {};
  const markersChecked: { [id: number]: boolean; } = {};
  const checkNode = (node: Node) => {
    if (nodesChecked[node.id]) return;
    else nodesChecked[node.id] = true;

    const isLink = !!(node?.from_id && node?.to_id);
    const isRoot = isLink ? false : !node?.in?.length;

    const markers = mp.filter((m) => m.item_id === node.id);
    const flows = mp.filter((m) => m.item_id === node.id && m.path_item_id === node.id);

    debug(
      `check #${n[node.id]} ${isLink ? 'link' : 'node'} in${node?.in?.length} out${node?.out?.length}`,
      flows.map((pos) => {
        return `${n[pos.root_id]} [${pos.by_position.map((m) => `${n[m.path_item_id]}`).join(',')}]`;
      }),
    );

    for (let f = 0; f < flows.length; f++) {
      const flow = flows[f];
      const hasPositionsWithNotFlowId = mp.find(mp => mp.position_id === flow.position_id && mp.item_id !== flow.item_id);
      if (hasPositionsWithNotFlowId) invalid(`invalid positions position_id ${flow.position_id} must exists only for item_id ${flow.item_id} but exists for ${hasPositionsWithNotFlowId.item_id}`);
      const equalPositionIds = mp.filter(mp => mp.position_id === flow.position_id && mp.item_id === flow.item_id);
      if (equalPositionIds.length != flow.path_item_depth + 1) invalid(`invalid positions position_id ${flow.position_id} duplicates ${equalPositionIds.length} for flow.item_id ${flow.item_id} flow.path_item_depth ${flow.path_item_depth}`);
    }

    if (isRoot) {
      if (markers.length !== 1) invalid(`invalid node #${n[node.id]} root but markers.length = ${markers.length}`);
    }

    if (!markers.length) invalid(`invalid node #${n[node.id]} markers lost, markers.length = ${markers.length}`);

    flows.forEach((position) => {
      checkPosition(position);
    });
  };
  const checkPosition = (position: Marker) => {
    position.by_position.forEach((marker, i) => {
      markersChecked[marker.id] = true;
      if (marker.position_id != position.position_id) invalid(`invalid position ${n[position.root_id]} [${position.by_position.map((m) => n[m.path_item_id]).join(',')}] position_id not equal`);
      const node = nodes.find((n) => n.id === marker.path_item_id);
      if (!node) invalid(`invalid position ${n[position.root_id]} [${position.by_position.map((m) => n[m.path_item_id]).join(',')}] node lost #${n[marker.path_item_id]}`);
    });
  };
  nodes.forEach((node) => {
    checkNode(node);
  });
  mp.forEach((marker) => {
    if (!markersChecked[marker.id]) invalid(`invalid marker #${marker.id} of node #${n[marker.item_id]} ${n[marker.root_id]}[...${n[marker.path_item_id]}...]`);
  });
  if (!valid) throw new Error('invalid');

  return { nodes, mp };
};

export const checkManual = async (input: [number, number, number, number, [number, number][]][], type_id: number, GRAPH_TABLE: string, MP_TABLE: string) => {
  const { nodes, mp } = await fetch(type_id, ID_TYPE, GRAPH_TABLE, MP_TABLE);

  const ns = [];
  const ls = [];
  const handledMP = {};

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const l = input[i];
    ns.push({ id: n.id, from_id: n.from_id || 0, to_id: n.to_id || 0, type_id: n.type_id || 0, _by_item: mp.filter((mp) => {
      handledMP[mp.id] = true;
      return mp.item_id === n.id;
    }).map(a => ({ root_id: a.root_id, path_item_id: a.path_item_id })) });
    ls.push({ id: l[0], from_id: l[1], to_id: l[2], type_id: l[3], _by_item: l[4].map((a) => {
      return { root_id: a[0], path_item_id: a[1] };
    }) });
  }
  assert.deepStrictEqual(ns, ls);
  const notHandledMp = [];
  for (let i = 0; i < mp.length; i++) {
    const mark = mp[i];
    if (!handledMP[mark.id]) notHandledMp[mark.id];
  }
  if (notHandledMp.length) throw new Error(`Not handled MP marks: ${notHandledMp}`);
}
