"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const debug_1 = __importDefault(require("debug"));
const apollo_boost_1 = require("apollo-boost");
const chance_1 = __importDefault(require("chance"));
const check_1 = require("../check");
const client_1 = require("../client");
const chance = new chance_1.default();
const debug = debug_1.default('deepcase:materialized-path:test');
const SCHEMA = process.env.MIGRATIONS_SCHEMA || 'public';
const MP_TABLE = process.env.MIGRATIONS_MP_TABLE || 'mp_example__links__mp_md';
const GRAPH_TABLE = process.env.MIGRATIONS_GRAPH_TABLE || 'mp_example__links_md';
const ID_TYPE = process.env.MIGRATIONS_ID_TYPE_GQL || 'Int';
const DELAY = +process.env.DELAY || 0;
const delay = time => new Promise(res => setTimeout(res, time));
const itDelay = () => {
    if (DELAY) {
        (it)('delay', () => __awaiter(void 0, void 0, void 0, function* () {
            yield delay(DELAY);
        }));
    }
};
const insertNode = (type_id, dir, idType = ID_TYPE) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const result = yield client_1.client.mutate({ mutation: apollo_boost_1.gql `mutation InsertNode($type_id: ${idType}, $dir: String) {
    insert_links: insert_${GRAPH_TABLE}(objects: { type_id: $type_id, dir: $dir }) { returning { id } }
  }`, variables: { type_id, dir } });
    if (result === null || result === void 0 ? void 0 : result.errors) {
        throw result === null || result === void 0 ? void 0 : result.errors;
        console.error(result === null || result === void 0 ? void 0 : result.errors);
    }
    const id = (_d = (_c = (_b = (_a = result === null || result === void 0 ? void 0 : result.data) === null || _a === void 0 ? void 0 : _a.insert_links) === null || _b === void 0 ? void 0 : _b.returning) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.id;
    debug(`insert node #${id}`);
    return id;
});
const insertNodes = (nodes) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f;
    const result = yield client_1.client.mutate({ mutation: apollo_boost_1.gql `mutation InsertNodes($objects: [${GRAPH_TABLE}_insert_input!]!) {
    insert_links: insert_${GRAPH_TABLE}(objects: $objects) { returning { id } }
  }`, variables: { objects: nodes } });
    if (result === null || result === void 0 ? void 0 : result.errors) {
        throw result === null || result === void 0 ? void 0 : result.errors;
        console.error(result === null || result === void 0 ? void 0 : result.errors);
    }
    const returning = ((_f = (_e = result === null || result === void 0 ? void 0 : result.data) === null || _e === void 0 ? void 0 : _e.insert_links) === null || _f === void 0 ? void 0 : _f.returning) || [];
    const ids = returning.map(({ id }) => id);
    debug(`insert nodes ${ids.length}`);
    return ids;
});
const insertLink = (fromId, toId, type_id, dir, idType = ID_TYPE) => __awaiter(void 0, void 0, void 0, function* () {
    var _g, _h, _j, _k;
    const result = yield client_1.client.mutate({ mutation: apollo_boost_1.gql `mutation InsertLink($fromId: ${idType}, $toId: ${idType}, $type_id: ${idType}, $dir: String) {
    insert_links: insert_${GRAPH_TABLE}(objects: { from_id: $fromId, to_id: $toId, type_id: $type_id, dir: $dir }) { returning { id } }
  }`, variables: { fromId, toId, type_id, dir } });
    if (result === null || result === void 0 ? void 0 : result.errors) {
        throw result === null || result === void 0 ? void 0 : result.errors;
        console.error(result === null || result === void 0 ? void 0 : result.errors);
    }
    const id = (_k = (_j = (_h = (_g = result === null || result === void 0 ? void 0 : result.data) === null || _g === void 0 ? void 0 : _g.insert_links) === null || _h === void 0 ? void 0 : _h.returning) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.id;
    debug(`insert link #${id} (#${fromId} -> #${toId})`);
    return id;
});
const clear = (type_id, idType = ID_TYPE) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield client_1.client.mutate({ mutation: apollo_boost_1.gql `mutation Clear($type_id: ${idType}) {
    delete_links__mp: delete_${MP_TABLE}(where: { item: { type_id: { _eq: $type_id } } }) { affected_rows }
    delete_links: delete_${GRAPH_TABLE}(where: { type_id: { _eq: $type_id } }) { affected_rows }
  }`, variables: { type_id } });
    if (result === null || result === void 0 ? void 0 : result.errors) {
        throw result === null || result === void 0 ? void 0 : result.errors;
        console.error(result === null || result === void 0 ? void 0 : result.errors);
    }
    debug(`clear type_id #${type_id}`);
});
const deleteNode = (id, idType = ID_TYPE) => __awaiter(void 0, void 0, void 0, function* () {
    var _l, _m, _o, _p;
    const result = yield client_1.client.mutate({ mutation: apollo_boost_1.gql `mutation DeleteNode($id: ${idType}) {
    delete_links: delete_${GRAPH_TABLE}(where: { id: { _eq: $id } }) { returning { id } }
  }`, variables: { id } });
    if (result === null || result === void 0 ? void 0 : result.errors) {
        throw result === null || result === void 0 ? void 0 : result.errors;
        console.error(result === null || result === void 0 ? void 0 : result.errors);
    }
    debug(`delete node #${id}`);
    return (_p = (_o = (_m = (_l = result === null || result === void 0 ? void 0 : result.data) === null || _l === void 0 ? void 0 : _l.delete_links) === null || _m === void 0 ? void 0 : _m.returning) === null || _o === void 0 ? void 0 : _o[0]) === null || _p === void 0 ? void 0 : _p.id;
});
const generateTree = (initialId, count = 1000) => {
    let i = initialId + 1;
    const paths = { [initialId]: [initialId] };
    const array = [{ id: initialId }];
    const nodes = [...array];
    for (let c = 0; c < count; c++) {
        const s = chance.integer({ min: 0, max: nodes.length - 1 });
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
const findNoParent = (notId, type_id, idType = ID_TYPE) => __awaiter(void 0, void 0, void 0, function* () {
    var _q, _r;
    const result = yield client_1.client.query({ query: apollo_boost_1.gql `query FIND_NO_PARENT($notId: ${idType}, $type_id: ${idType}) {
    nodes: ${GRAPH_TABLE}(where: {
      from_id: { _is_null: true },
      to_id: { _is_null: true },
      _not: { _by_path_item: { item_id: {_eq: $notId} } }
    }) { id }
  }`, variables: { notId, type_id } });
    debug(`findNoParent notId #${notId} (${(((_q = result === null || result === void 0 ? void 0 : result.data) === null || _q === void 0 ? void 0 : _q.nodes) || []).length})`);
    return { nodes: ((_r = result === null || result === void 0 ? void 0 : result.data) === null || _r === void 0 ? void 0 : _r.nodes) || [] };
});
const countMp = () => __awaiter(void 0, void 0, void 0, function* () {
    var _s, _t, _u;
    const result = yield client_1.client.query({ query: apollo_boost_1.gql `query COUNT_MP {
    mp_example__links__mp_aggregate {
      aggregate {
        count
      }
    }
  }` });
    return (_u = (_t = (_s = result === null || result === void 0 ? void 0 : result.data) === null || _s === void 0 ? void 0 : _s.mp_example__links__mp_aggregate) === null || _t === void 0 ? void 0 : _t.aggregate) === null || _u === void 0 ? void 0 : _u.count;
});
const generateMultiparentalTree = (array, nodesHash, count = 100) => __awaiter(void 0, void 0, void 0, function* () {
    const nodes = array.filter(a => !a.from_id && !a.to_id);
    let founded = 0;
    let skipped = 0;
    for (let i = 0; i < count; i++) {
        const s = chance.integer({ min: 0, max: nodes.length - 1 });
        const sn = nodes[s];
        const { nodes: possibles } = yield findNoParent(sn.id, type_id);
        if (possibles.length) {
            const t = chance.integer({ min: 0, max: possibles.length - 1 });
            const tn = possibles[t];
            debug(`possible ${sn.id} => ${tn.id}`);
            if (sn && tn) {
                const id = yield insertLink(sn.id, tn.id, type_id, 'down');
                nodesHash[id] = id;
                founded++;
                debug(`count mp: ${yield countMp()}`);
            }
        }
        else {
            debug(`!possibles #${sn.id}`);
            skipped++;
        }
    }
    debug(`multiparental tree founded: ${founded}, skipped: ${skipped}`);
});
let type_id;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield clear(type_id);
    yield deleteNode(type_id);
    jest.setTimeout(1000000);
}));
(it)('prepare', () => __awaiter(void 0, void 0, void 0, function* () {
    const ids = yield insertNodes({});
    type_id = ids[0];
    debug('prepare', ids);
}));
it('+15', () => __awaiter(void 0, void 0, void 0, function* () {
    debug('+15');
    yield clear(type_id);
    const a = yield insertNode(type_id, 'node');
    const b = yield insertNode(type_id, 'up');
    const c = yield insertLink(b, a, type_id, 'up');
    const d = yield insertNode(type_id, 'node');
    const e = yield insertLink(b, d, type_id, 'down');
    const y = yield insertLink(d, a, type_id, 'up');
    const f = yield insertNode(type_id, 'down');
    const g = yield insertLink(b, f, type_id, 'node');
    yield check_1.checkManual([
        [a, 0, 0, type_id, [[a, a]]],
        [b, 0, 0, type_id, [[a, a], [a, c], [a, b]]],
        [c, b, a, type_id, [[a, a], [a, c]]],
        [d, 0, 0, type_id, [[a, a], [a, c], [a, b], [a, e], [a, d], [a, a], [a, y], [a, d]]],
        [e, b, d, type_id, [[a, a], [a, c], [a, b], [a, e]]],
        [y, d, a, type_id, [[a, a], [a, y]]],
        [f, 0, 0, type_id, [[f, f]]],
        [g, b, f, type_id, [[g, g]]],
    ], type_id, GRAPH_TABLE, MP_TABLE);
}));
itDelay();
it('-15', () => __awaiter(void 0, void 0, void 0, function* () {
    debug('-15');
    yield clear(type_id);
    const a = yield insertNode(type_id, 'node');
    const b = yield insertNode(type_id, 'up');
    const c = yield insertLink(b, a, type_id, 'up');
    const d = yield insertNode(type_id, 'node');
    const e = yield insertLink(b, d, type_id, 'down');
    const y = yield insertLink(d, a, type_id, 'up');
    const f = yield insertNode(type_id, 'down');
    const g = yield insertLink(b, f, type_id, 'node');
    yield deleteNode(y);
    yield check_1.checkManual([
        [a, 0, 0, type_id, [[a, a]]],
        [b, 0, 0, type_id, [[a, a], [a, c], [a, b]]],
        [c, b, a, type_id, [[a, a], [a, c]]],
        [d, 0, 0, type_id, [[a, a], [a, c], [a, b], [a, e], [a, d]]],
        [e, b, d, type_id, [[a, a], [a, c], [a, b], [a, e]]],
        [f, 0, 0, type_id, [[f, f]]],
        [g, b, f, type_id, [[g, g]]],
    ], type_id, GRAPH_TABLE, MP_TABLE);
}));
//# sourceMappingURL=multidirectional.js.map