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
exports.testSeparation2 = exports.testSeparation1 = exports.testRecursiveSameRoot = exports.testRecursive = exports.testMinus15 = exports.testPlus15 = exports.prepare = exports.beforeAllHandler = exports.type_id = exports.countMp = exports.findNoParent = exports.deleteNode = exports.clear = exports.insertLink = exports.insertNodes = exports.insertNode = void 0;
require('dotenv').config();
const debug_1 = __importDefault(require("debug"));
const client_1 = require("@apollo/client");
const chance_1 = __importDefault(require("chance"));
const check_1 = require("../check");
const client_2 = require("../client");
const chance = new chance_1.default();
const debug = debug_1.default('materialized-path:test');
const SCHEMA = process.env.MIGRATIONS_SCHEMA || 'public';
const MP_TABLE = process.env.MIGRATIONS_MP_TABLE || 'mp_example__links__mp_md';
const GRAPH_TABLE = process.env.MIGRATIONS_GRAPH_TABLE || 'mp_example__links_md';
const ID_TYPE = process.env.MIGRATIONS_ID_TYPE_GQL || 'Int';
exports.insertNode = (type_id, dir, idType = ID_TYPE) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const result = yield client_2.client.mutate({ mutation: client_1.gql `mutation InsertNode($type_id: ${idType}, $dir: String) {
    insert_links: insert_${GRAPH_TABLE}(objects: { type_id: $type_id, dir: $dir }) { returning { id } }
  }`, variables: { type_id, dir } });
    if (result === null || result === void 0 ? void 0 : result.errors) {
        console.error('insertNode', type_id);
        throw result === null || result === void 0 ? void 0 : result.errors;
    }
    const id = (_d = (_c = (_b = (_a = result === null || result === void 0 ? void 0 : result.data) === null || _a === void 0 ? void 0 : _a.insert_links) === null || _b === void 0 ? void 0 : _b.returning) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.id;
    debug(`insert node #${id}`);
    return id;
});
exports.insertNodes = (nodes) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f;
    const result = yield client_2.client.mutate({ mutation: client_1.gql `mutation InsertNodes($objects: [${GRAPH_TABLE}_insert_input!]!) {
    insert_links: insert_${GRAPH_TABLE}(objects: $objects) { returning { id } }
  }`, variables: { objects: nodes } });
    if (result === null || result === void 0 ? void 0 : result.errors) {
        console.error('insertNodes', nodes);
        throw result === null || result === void 0 ? void 0 : result.errors;
    }
    const returning = ((_f = (_e = result === null || result === void 0 ? void 0 : result.data) === null || _e === void 0 ? void 0 : _e.insert_links) === null || _f === void 0 ? void 0 : _f.returning) || [];
    const ids = returning.map(({ id }) => id);
    debug(`insert nodes ${ids.length}`);
    return ids;
});
exports.insertLink = (fromId, toId, type_id, dir, idType = ID_TYPE) => __awaiter(void 0, void 0, void 0, function* () {
    var _g, _h, _j, _k;
    const result = yield client_2.client.mutate({ mutation: client_1.gql `mutation InsertLink($fromId: ${idType}, $toId: ${idType}, $type_id: ${idType}, $dir: String) {
    insert_links: insert_${GRAPH_TABLE}(objects: { from_id: $fromId, to_id: $toId, type_id: $type_id, dir: $dir }) { returning { id } }
  }`, variables: { fromId, toId, type_id, dir } });
    if (result === null || result === void 0 ? void 0 : result.errors) {
        console.error('insertNodes', { fromId, toId, type_id });
        throw result === null || result === void 0 ? void 0 : result.errors;
    }
    const id = (_k = (_j = (_h = (_g = result === null || result === void 0 ? void 0 : result.data) === null || _g === void 0 ? void 0 : _g.insert_links) === null || _h === void 0 ? void 0 : _h.returning) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.id;
    debug(`insert link #${id} (#${fromId} -> #${toId})`);
    return id;
});
exports.clear = (type_id, idType = ID_TYPE) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield client_2.client.mutate({ mutation: client_1.gql `mutation Clear($type_id: ${idType}) {
    delete_links__mp: delete_${MP_TABLE}(where: { item: { type_id: { _eq: $type_id } } }) { affected_rows }
    delete_links: delete_${GRAPH_TABLE}(where: { type_id: { _eq: $type_id } }) { affected_rows }
  }`, variables: { type_id } });
    if (result === null || result === void 0 ? void 0 : result.errors) {
        console.error('clear', { type_id });
        throw result === null || result === void 0 ? void 0 : result.errors;
    }
    debug(`clear type_id #${type_id}`);
});
exports.deleteNode = (id, idType = ID_TYPE) => __awaiter(void 0, void 0, void 0, function* () {
    var _l, _m, _o, _p;
    const result = yield client_2.client.mutate({ mutation: client_1.gql `mutation DeleteNode($id: ${idType}) {
    delete_links: delete_${GRAPH_TABLE}(where: { id: { _eq: $id } }) { returning { id } }
  }`, variables: { id } });
    if (result === null || result === void 0 ? void 0 : result.errors) {
        console.error('deleteNode', { id });
        throw result === null || result === void 0 ? void 0 : result.errors;
    }
    debug(`delete node #${id}`);
    return (_p = (_o = (_m = (_l = result === null || result === void 0 ? void 0 : result.data) === null || _l === void 0 ? void 0 : _l.delete_links) === null || _m === void 0 ? void 0 : _m.returning) === null || _o === void 0 ? void 0 : _o[0]) === null || _p === void 0 ? void 0 : _p.id;
});
exports.findNoParent = (notId, type_id, idType = ID_TYPE) => __awaiter(void 0, void 0, void 0, function* () {
    var _q, _r;
    const result = yield client_2.client.query({ query: client_1.gql `query FIND_NO_PARENT($notId: ${idType}, $type_id: ${idType}) {
    nodes: ${GRAPH_TABLE}(where: {
      from_id: { _is_null: true },
      to_id: { _is_null: true },
      _not: { _by_path_item: { item_id: {_eq: $notId} } }
    }) { id }
  }`, variables: { notId, type_id } });
    debug(`findNoParent notId #${notId} (${(((_q = result === null || result === void 0 ? void 0 : result.data) === null || _q === void 0 ? void 0 : _q.nodes) || []).length})`);
    return { nodes: ((_r = result === null || result === void 0 ? void 0 : result.data) === null || _r === void 0 ? void 0 : _r.nodes) || [] };
});
exports.countMp = () => __awaiter(void 0, void 0, void 0, function* () {
    var _s, _t, _u;
    const result = yield client_2.client.query({ query: client_1.gql `query COUNT_MP {
    mp_example__links__mp_aggregate {
      aggregate {
        count
      }
    }
  }` });
    return (_u = (_t = (_s = result === null || result === void 0 ? void 0 : result.data) === null || _s === void 0 ? void 0 : _s.mp_example__links__mp_aggregate) === null || _t === void 0 ? void 0 : _t.aggregate) === null || _u === void 0 ? void 0 : _u.count;
});
exports.beforeAllHandler = () => __awaiter(void 0, void 0, void 0, function* () {
    if (exports.type_id) {
        yield exports.clear(exports.type_id);
        yield exports.deleteNode(exports.type_id);
    }
    if (global.jest)
        jest.setTimeout(1000000);
});
exports.prepare = () => __awaiter(void 0, void 0, void 0, function* () {
    const ids = yield exports.insertNodes({});
    exports.type_id = ids[0];
    debug('prepare', ids);
    return exports.type_id;
});
exports.testPlus15 = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('+15');
    yield exports.clear(exports.type_id);
    const a = yield exports.insertNode(exports.type_id, 'node');
    const b = yield exports.insertNode(exports.type_id, 'up');
    const c = yield exports.insertLink(b, a, exports.type_id, 'up');
    const d = yield exports.insertNode(exports.type_id, 'node');
    const e = yield exports.insertLink(b, d, exports.type_id, 'down');
    const y = yield exports.insertLink(d, a, exports.type_id, 'up');
    const f = yield exports.insertNode(exports.type_id, 'down');
    const g = yield exports.insertLink(b, f, exports.type_id, 'node');
    if (needCheck)
        yield check_1.checkManual([
            [a, 0, 0, exports.type_id, [[a, a]]],
            [b, 0, 0, exports.type_id, [[a, a], [a, c], [a, b]]],
            [c, b, a, exports.type_id, [[a, a], [a, c]]],
            [d, 0, 0, exports.type_id, [[a, a], [a, c], [a, b], [a, e], [a, d], [a, a], [a, y], [a, d]]],
            [e, b, d, exports.type_id, [[a, a], [a, c], [a, b], [a, e]]],
            [y, d, a, exports.type_id, [[a, a], [a, y]]],
            [f, 0, 0, exports.type_id, [[f, f]]],
            [g, b, f, exports.type_id, [[g, g]]],
        ], exports.type_id, GRAPH_TABLE, MP_TABLE);
});
exports.testMinus15 = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('-15');
    yield exports.clear(exports.type_id);
    const a = yield exports.insertNode(exports.type_id, 'node');
    const b = yield exports.insertNode(exports.type_id, 'up');
    const c = yield exports.insertLink(b, a, exports.type_id, 'up');
    const d = yield exports.insertNode(exports.type_id, 'node');
    const e = yield exports.insertLink(b, d, exports.type_id, 'down');
    const y = yield exports.insertLink(d, a, exports.type_id, 'up');
    const f = yield exports.insertNode(exports.type_id, 'down');
    const g = yield exports.insertLink(b, f, exports.type_id, 'node');
    yield exports.deleteNode(y);
    if (needCheck)
        yield check_1.checkManual([
            [a, 0, 0, exports.type_id, [[a, a]]],
            [b, 0, 0, exports.type_id, [[a, a], [a, c], [a, b]]],
            [c, b, a, exports.type_id, [[a, a], [a, c]]],
            [d, 0, 0, exports.type_id, [[a, a], [a, c], [a, b], [a, e], [a, d]]],
            [e, b, d, exports.type_id, [[a, a], [a, c], [a, b], [a, e]]],
            [f, 0, 0, exports.type_id, [[f, f]]],
            [g, b, f, exports.type_id, [[g, g]]],
        ], exports.type_id, GRAPH_TABLE, MP_TABLE);
});
exports.testRecursive = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('recursive');
    yield exports.clear(exports.type_id);
    const a = yield exports.insertNode(exports.type_id, 'node');
    const b = yield exports.insertNode(exports.type_id, 'node');
    const c = yield exports.insertLink(b, a, exports.type_id, 'down');
    let errored = false;
    try {
        const d = yield exports.insertLink(a, b, exports.type_id, 'down');
    }
    catch (error) {
        errored = true;
    }
    if (!errored)
        throw new Error('Recursion error not exists');
});
exports.testRecursiveSameRoot = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('recursive');
    yield exports.clear(exports.type_id);
    const r = yield exports.insertNode(exports.type_id, 'node');
    const a = yield exports.insertNode(exports.type_id, 'node');
    const b = yield exports.insertNode(exports.type_id, 'node');
    const x = yield exports.insertLink(r, a, exports.type_id, 'down');
    const y = yield exports.insertLink(r, b, exports.type_id, 'down');
    const c = yield exports.insertLink(b, a, exports.type_id, 'down');
    let errored = false;
    try {
        const d = yield exports.insertLink(a, b, exports.type_id, 'down');
    }
    catch (error) {
        errored = true;
    }
    if (!errored)
        throw new Error('Recursion error not exists');
});
exports.testSeparation1 = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('testSeparation1');
    yield exports.clear(exports.type_id);
    const a = yield exports.insertNode(exports.type_id, 'node');
    const b = yield exports.insertNode(exports.type_id, 'node');
    const c = yield exports.insertNode(exports.type_id, 'node');
    const d = yield exports.insertNode(exports.type_id, 'node');
    const e = yield exports.insertNode(exports.type_id, 'node');
    const x = yield exports.insertLink(a, b, exports.type_id, 'down');
    const y = yield exports.insertLink(b, c, exports.type_id, 'down');
    const z = yield exports.insertLink(c, d, exports.type_id, 'down');
    const w = yield exports.insertLink(d, e, exports.type_id, 'down');
    if (needCheck)
        yield check_1.checkManual([
            [a, 0, 0, exports.type_id, [[a, a]]],
            [b, 0, 0, exports.type_id, [[a, a], [a, x], [a, b]]],
            [c, 0, 0, exports.type_id, [[a, a], [a, x], [a, b], [a, y], [a, c]]],
            [d, 0, 0, exports.type_id, [[a, a], [a, x], [a, b], [a, y], [a, c], [a, z], [a, d]]],
            [e, 0, 0, exports.type_id, [[a, a], [a, x], [a, b], [a, y], [a, c], [a, z], [a, d], [a, w], [a, e]]],
            [x, a, b, exports.type_id, [[a, a], [a, x]]],
            [y, b, c, exports.type_id, [[a, a], [a, x], [a, b], [a, y]]],
            [z, c, d, exports.type_id, [[a, a], [a, x], [a, b], [a, y], [a, c], [a, z]]],
            [w, d, e, exports.type_id, [[a, a], [a, x], [a, b], [a, y], [a, c], [a, z], [a, d], [a, w]]],
        ], exports.type_id, GRAPH_TABLE, MP_TABLE);
});
exports.testSeparation2 = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('testSeparation2');
    yield exports.clear(exports.type_id);
    const a = yield exports.insertNode(exports.type_id, 'node');
    const b = yield exports.insertNode(exports.type_id, 'node');
    const c = yield exports.insertNode(exports.type_id, 'node');
    const d = yield exports.insertNode(exports.type_id, 'node');
    const e = yield exports.insertNode(exports.type_id, 'node');
    const x = yield exports.insertLink(a, b, exports.type_id, 'down');
    const y = yield exports.insertLink(b, c, exports.type_id, 'down');
    const z = yield exports.insertLink(c, d, exports.type_id, 'down');
    const w = yield exports.insertLink(d, e, exports.type_id, 'down');
    yield exports.deleteNode(y);
    if (needCheck)
        yield check_1.checkManual([
            [a, 0, 0, exports.type_id, [[a, a]]],
            [b, 0, 0, exports.type_id, [[a, a], [a, x], [a, b]]],
            [c, 0, 0, exports.type_id, [[c, c]]],
            [d, 0, 0, exports.type_id, [[c, c], [c, z], [c, d]]],
            [e, 0, 0, exports.type_id, [[c, c], [c, z], [c, d], [c, w], [c, e]]],
            [x, a, b, exports.type_id, [[a, a], [a, x]]],
            [z, c, d, exports.type_id, [[c, c], [c, z]]],
            [w, d, e, exports.type_id, [[c, c], [c, z], [c, d], [c, w]]],
        ], exports.type_id, GRAPH_TABLE, MP_TABLE);
});
//# sourceMappingURL=multidirectional.js.map