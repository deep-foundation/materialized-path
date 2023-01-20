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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testRecursiveLong = exports.testRecursiveSameRoot = exports.testRecursive = exports.testDeeplinksDemoTree = exports.test14 = exports.test13 = exports.test12 = exports.test11 = exports.test10 = exports.test9 = exports.test8 = exports.testMultiparentalTree = exports.testMultipleWays = exports.testtree = exports.testMinus7 = exports.testPlus7 = exports.testMinus5 = exports.testPlus5 = exports.testMinus4 = exports.testPlus4 = exports.testMinus3 = exports.testPlus3 = exports.testMinus2 = exports.testPlus2 = exports.testMinus1 = exports.testPlus1 = exports.prepare = exports.beforeAllHandler = exports.type_id = exports.generateMultiparentalTree = exports.countMp = exports.findNoParent = exports.generateTree = exports.deleteNode = exports.clear = exports.insertLink = exports.insertNodes = exports.insertNode = void 0;
require('dotenv').config();
const debug_1 = __importDefault(require("debug"));
const client_1 = require("@apollo/client");
const chance_1 = __importDefault(require("chance"));
const check_1 = require("../check");
const client_2 = require("../client");
const chance = new chance_1.default();
const debug = debug_1.default('materialized-path:test');
const SCHEMA = process.env.MIGRATIONS_SCHEMA || 'public';
const MP_TABLE = process.env.MIGRATIONS_MP_TABLE || 'mp_example__links__mp';
const GRAPH_TABLE = process.env.MIGRATIONS_GRAPH_TABLE || 'mp_example__links';
const ID_TYPE = process.env.MIGRATIONS_ID_TYPE_GQL || 'Int';
exports.insertNode = (type_id, idType = ID_TYPE) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const result = yield client_2.client.mutate({ mutation: client_1.gql `mutation InsertNode($type_id: ${idType}) {
    insert_links: insert_${GRAPH_TABLE}(objects: { type_id: $type_id }) { returning { id } }
  }`, variables: { type_id } });
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
exports.insertLink = (fromId, toId, type_id, idType = ID_TYPE) => __awaiter(void 0, void 0, void 0, function* () {
    var _g, _h, _j, _k;
    const result = yield client_2.client.mutate({ mutation: client_1.gql `mutation InsertLink($fromId: ${idType}, $toId: ${idType}, $type_id: ${idType}) {
    insert_links: insert_${GRAPH_TABLE}(objects: { from_id: $fromId, to_id: $toId, type_id: $type_id }) { returning { id } }
  }`, variables: { fromId, toId, type_id } });
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
exports.generateTree = (initialId, count = 1000) => {
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
exports.generateMultiparentalTree = (array, nodesHash, count = 100) => __awaiter(void 0, void 0, void 0, function* () {
    const nodes = array.filter(a => !a.from_id && !a.to_id);
    let founded = 0;
    let skipped = 0;
    for (let i = 0; i < count; i++) {
        const s = chance.integer({ min: 0, max: nodes.length - 1 });
        const sn = nodes[s];
        const { nodes: possibles } = yield exports.findNoParent(sn.id, exports.type_id);
        if (possibles.length) {
            const t = chance.integer({ min: 0, max: possibles.length - 1 });
            const tn = possibles[t];
            debug(`possible ${sn.id} => ${tn.id}`);
            if (sn && tn) {
                const id = yield exports.insertLink(sn.id, tn.id, exports.type_id);
                nodesHash[id] = id;
                founded++;
                debug(`count mp: ${yield exports.countMp()}`);
            }
        }
        else {
            debug(`!possibles #${sn.id}`);
            skipped++;
        }
    }
    debug(`multiparental tree founded: ${founded}, skipped: ${skipped}`);
});
exports.beforeAllHandler = () => __awaiter(void 0, void 0, void 0, function* () {
    if (exports.type_id) {
        yield exports.clear(exports.type_id);
        yield exports.deleteNode(exports.type_id);
    }
    if (global === null || global === void 0 ? void 0 : global.jest)
        jest.setTimeout(1000000);
    return exports.type_id;
});
exports.prepare = () => __awaiter(void 0, void 0, void 0, function* () {
    const ids = yield exports.insertNodes({});
    exports.type_id = ids[0];
    debug('prepare', ids);
    return exports.type_id;
});
exports.testPlus1 = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('+1');
    yield exports.clear(exports.type_id);
    const a = yield exports.insertNode(exports.type_id);
    const b = yield exports.insertNode(exports.type_id);
    if (needCheck)
        yield check_1.check({ a, b }, exports.type_id);
});
exports.testMinus1 = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('-1');
    yield exports.clear(exports.type_id);
    const a = yield exports.insertNode(exports.type_id);
    const b = yield exports.insertNode(exports.type_id);
    yield exports.deleteNode(a);
    if (needCheck)
        yield check_1.check({ a, b }, exports.type_id);
});
exports.testPlus2 = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('+2');
    yield exports.clear(exports.type_id);
    const a = yield exports.insertNode(exports.type_id);
    const b = yield exports.insertNode(exports.type_id);
    const c = yield exports.insertLink(a, b, exports.type_id);
    if (needCheck)
        yield check_1.check({ a, b, c }, exports.type_id);
});
exports.testMinus2 = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('-2');
    yield exports.clear(exports.type_id);
    const a = yield exports.insertNode(exports.type_id);
    const b = yield exports.insertNode(exports.type_id);
    const c = yield exports.insertLink(a, b, exports.type_id);
    yield exports.deleteNode(c);
    if (needCheck)
        yield check_1.check({ a, b, c }, exports.type_id);
});
exports.testPlus3 = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('+3');
    yield exports.clear(exports.type_id);
    const a = yield exports.insertNode(exports.type_id);
    const b = yield exports.insertNode(exports.type_id);
    const c = yield exports.insertLink(a, b, exports.type_id);
    const d = yield exports.insertNode(exports.type_id);
    const e = yield exports.insertLink(b, d, exports.type_id);
    if (needCheck)
        yield check_1.check({ a, b, c, d, e }, exports.type_id);
    if (needCheck)
        yield check_1.checkManual([
            [a, 0, 0, exports.type_id, [[a, a]]],
            [b, 0, 0, exports.type_id, [[a, a], [a, c], [a, b]]],
            [c, a, b, exports.type_id, [[a, a], [a, c]]],
            [d, 0, 0, exports.type_id, [[a, a], [a, c], [a, b], [a, e], [a, d]]],
            [e, b, d, exports.type_id, [[a, a], [a, c], [a, b], [a, e]]],
        ], exports.type_id, GRAPH_TABLE, MP_TABLE);
});
exports.testMinus3 = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('-3');
    yield exports.clear(exports.type_id);
    const a = yield exports.insertNode(exports.type_id);
    const b = yield exports.insertNode(exports.type_id);
    const c = yield exports.insertLink(a, b, exports.type_id);
    const d = yield exports.insertNode(exports.type_id);
    const e = yield exports.insertLink(b, d, exports.type_id);
    yield exports.deleteNode(e);
    if (needCheck)
        yield check_1.check({ a, b, c, d, e }, exports.type_id);
    if (needCheck)
        yield check_1.checkManual([
            [a, 0, 0, exports.type_id, [[a, a]]],
            [b, 0, 0, exports.type_id, [[a, a], [a, c], [a, b]]],
            [c, a, b, exports.type_id, [[a, a], [a, c]]],
            [d, 0, 0, exports.type_id, [[d, d]]],
        ], exports.type_id, GRAPH_TABLE, MP_TABLE);
});
exports.testPlus4 = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('+4');
    yield exports.clear(exports.type_id);
    const a = yield exports.insertNode(exports.type_id);
    const b = yield exports.insertNode(exports.type_id);
    const c = yield exports.insertLink(a, b, exports.type_id);
    const d = yield exports.insertNode(exports.type_id);
    const e = yield exports.insertLink(b, d, exports.type_id);
    const x = yield exports.insertNode(exports.type_id);
    const y = yield exports.insertLink(x, a, exports.type_id);
    if (needCheck)
        yield check_1.check({ a, b, c, d, e, x, y }, exports.type_id);
});
exports.testMinus4 = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('-4');
    yield exports.clear(exports.type_id);
    const a = yield exports.insertNode(exports.type_id);
    const b = yield exports.insertNode(exports.type_id);
    const c = yield exports.insertLink(a, b, exports.type_id);
    const d = yield exports.insertNode(exports.type_id);
    const e = yield exports.insertLink(b, d, exports.type_id);
    const x = yield exports.insertNode(exports.type_id);
    const y = yield exports.insertLink(x, a, exports.type_id);
    yield exports.deleteNode(y);
    if (needCheck)
        yield check_1.check({ a, b, c, d, e, x, y }, exports.type_id);
    if (needCheck)
        yield check_1.checkManual([
            [a, 0, 0, exports.type_id, [[a, a]]],
            [b, 0, 0, exports.type_id, [[a, a], [a, c], [a, b]]],
            [c, a, b, exports.type_id, [[a, a], [a, c]]],
            [d, 0, 0, exports.type_id, [[a, a], [a, c], [a, b], [a, e], [a, d]]],
            [e, b, d, exports.type_id, [[a, a], [a, c], [a, b], [a, e]]],
            [x, 0, 0, exports.type_id, [[x, x]]],
        ], exports.type_id, GRAPH_TABLE, MP_TABLE);
});
exports.testPlus5 = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('+5');
    yield exports.clear(exports.type_id);
    const a = yield exports.insertNode(exports.type_id);
    const b = yield exports.insertNode(exports.type_id);
    const c = yield exports.insertLink(a, b, exports.type_id);
    const d = yield exports.insertNode(exports.type_id);
    const e = yield exports.insertLink(b, d, exports.type_id);
    const x = yield exports.insertNode(exports.type_id);
    const y = yield exports.insertLink(x, b, exports.type_id);
    if (needCheck)
        yield check_1.check({ a, b, c, d, e, x, y }, exports.type_id);
    if (needCheck)
        yield check_1.checkManual([
            [a, 0, 0, exports.type_id, [[a, a]]],
            [b, 0, 0, exports.type_id, [[a, a], [a, c], [a, b], [x, x], [x, y], [x, b]]],
            [c, a, b, exports.type_id, [[a, a], [a, c]]],
            [d, 0, 0, exports.type_id, [[a, a], [a, c], [a, b], [a, e], [a, d], [x, x], [x, y], [x, b], [x, e], [x, d]]],
            [e, b, d, exports.type_id, [[a, a], [a, c], [a, b], [a, e], [x, x], [x, y], [x, b], [x, e]]],
            [x, 0, 0, exports.type_id, [[x, x]]],
            [y, x, b, exports.type_id, [[x, x], [x, y]]],
        ], exports.type_id, GRAPH_TABLE, MP_TABLE);
});
exports.testMinus5 = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('-5');
    yield exports.clear(exports.type_id);
    const a = yield exports.insertNode(exports.type_id);
    const b = yield exports.insertNode(exports.type_id);
    const c = yield exports.insertLink(a, b, exports.type_id);
    const d = yield exports.insertNode(exports.type_id);
    const e = yield exports.insertLink(b, d, exports.type_id);
    const x = yield exports.insertNode(exports.type_id);
    const y = yield exports.insertLink(x, b, exports.type_id);
    yield exports.deleteNode(y);
    if (needCheck)
        yield check_1.check({ a, b, c, d, e, x, y }, exports.type_id);
    if (needCheck)
        yield check_1.checkManual([
            [a, 0, 0, exports.type_id, [[a, a]]],
            [b, 0, 0, exports.type_id, [[a, a], [a, c], [a, b]]],
            [c, a, b, exports.type_id, [[a, a], [a, c]]],
            [d, 0, 0, exports.type_id, [[a, a], [a, c], [a, b], [a, e], [a, d]]],
            [e, b, d, exports.type_id, [[a, a], [a, c], [a, b], [a, e]]],
            [x, 0, 0, exports.type_id, [[x, x]]],
        ], exports.type_id, GRAPH_TABLE, MP_TABLE);
});
exports.testPlus7 = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('+7');
    yield exports.clear(exports.type_id);
    const a = yield exports.insertNode(exports.type_id);
    const b = yield exports.insertNode(exports.type_id);
    const c = yield exports.insertLink(a, b, exports.type_id);
    const d = yield exports.insertNode(exports.type_id);
    const e = yield exports.insertLink(b, d, exports.type_id);
    const y = yield exports.insertLink(a, d, exports.type_id);
    if (needCheck)
        yield check_1.check({ a, b, c, d, e, y }, exports.type_id);
});
exports.testMinus7 = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('-7');
    yield exports.clear(exports.type_id);
    const a = yield exports.insertNode(exports.type_id);
    const b = yield exports.insertNode(exports.type_id);
    const c = yield exports.insertLink(a, b, exports.type_id);
    const d = yield exports.insertNode(exports.type_id);
    const e = yield exports.insertLink(b, d, exports.type_id);
    const y = yield exports.insertLink(a, d, exports.type_id);
    yield exports.deleteNode(y);
    if (needCheck)
        yield check_1.check({ a, b, c, d, e, y }, exports.type_id);
});
exports.testtree = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('tree');
    yield exports.clear(exports.type_id);
    const a = yield exports.insertNode(exports.type_id);
    const { array } = exports.generateTree(a, 1000);
    const ids = yield exports.insertNodes(array.map((_a) => {
        var { id } = _a, a = __rest(_a, ["id"]);
        return (Object.assign(Object.assign({}, a), { type_id: exports.type_id }));
    }));
    const ns = {};
    for (let d = 0; d < ids.length; d++)
        ns[ids[d]] = ids[d];
    if (needCheck)
        yield check_1.check(Object.assign({ a }, ns), exports.type_id);
});
exports.testMultipleWays = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('multiple ways');
    yield exports.clear(exports.type_id);
    const a = yield exports.insertNode(exports.type_id);
    const b = yield exports.insertNode(exports.type_id);
    const c = yield exports.insertNode(exports.type_id);
    const d = yield exports.insertNode(exports.type_id);
    const x = yield exports.insertLink(a, b, exports.type_id);
    const y = yield exports.insertLink(a, b, exports.type_id);
    const r = yield exports.insertLink(a, c, exports.type_id);
    const m = yield exports.insertLink(b, d, exports.type_id);
    const n = yield exports.insertLink(b, d, exports.type_id);
    const f = yield exports.insertLink(d, c, exports.type_id);
    if (needCheck)
        yield check_1.check({ a, b, c, d, x, y, r, m, n, f }, exports.type_id);
});
exports.testMultiparentalTree = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('multiparental tree');
    yield exports.clear(exports.type_id);
    const a = yield exports.insertNode(exports.type_id);
    const { array } = exports.generateTree(a, 100);
    const ids = yield exports.insertNodes(array.map((_a) => {
        var { id } = _a, a = __rest(_a, ["id"]);
        return (Object.assign(Object.assign({}, a), { type_id: exports.type_id }));
    }));
    const ns = {};
    for (let d = 0; d < ids.length; d++)
        ns[ids[d]] = ids[d];
    yield exports.generateMultiparentalTree(array, ns, 30);
    if (needCheck)
        yield check_1.check(Object.assign({ a }, ns), exports.type_id);
});
exports.test8 = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('8');
    yield exports.clear(exports.type_id);
    const w = yield exports.insertNode(exports.type_id);
    const a = w + 2;
    const b = w + 3;
    const c = yield exports.insertLink(a, b, exports.type_id);
    if (needCheck)
        yield check_1.check({ w }, exports.type_id);
    if (needCheck)
        yield check_1.checkManual([
            [w, 0, 0, exports.type_id, [[w, w]]],
            [c, a, b, exports.type_id, [[c, c]]],
        ], exports.type_id, GRAPH_TABLE, MP_TABLE);
    yield exports.insertNode(exports.type_id);
    yield exports.insertNode(exports.type_id);
});
exports.test9 = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('9');
    yield exports.clear(exports.type_id);
    const w = yield exports.insertNode(exports.type_id);
    const a = w + 2;
    const b = w + 3;
    const c = yield exports.insertLink(a, b, exports.type_id);
    yield exports.insertNode(exports.type_id);
    if (needCheck)
        yield check_1.check({ w, c, a }, exports.type_id);
    if (needCheck)
        yield check_1.checkManual([
            [w, 0, 0, exports.type_id, [[w, w]]],
            [c, a, b, exports.type_id, [[a, a], [a, c]]],
            [a, 0, 0, exports.type_id, [[a, a]]],
        ], exports.type_id, GRAPH_TABLE, MP_TABLE);
    yield exports.insertNode(exports.type_id);
});
exports.test10 = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('10');
    yield exports.clear(exports.type_id);
    const w = yield exports.insertNode(exports.type_id);
    const a = w + 3;
    const b = w + 2;
    const c = yield exports.insertLink(a, b, exports.type_id);
    yield exports.insertNode(exports.type_id);
    if (needCheck)
        yield check_1.check({ w, c, b }, exports.type_id);
    if (needCheck)
        yield check_1.checkManual([
            [w, 0, 0, exports.type_id, [[w, w]]],
            [c, a, b, exports.type_id, [[c, c]]],
            [b, 0, 0, exports.type_id, [[c, c], [c, b]]],
        ], exports.type_id, GRAPH_TABLE, MP_TABLE);
    yield exports.insertNode(exports.type_id);
});
exports.test11 = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('11');
    yield exports.clear(exports.type_id);
    const w = yield exports.insertNode(exports.type_id);
    const a = w + 3;
    const b = w + 2;
    const c = yield exports.insertLink(a, b, exports.type_id);
    yield exports.insertNode(exports.type_id);
    yield exports.insertNode(exports.type_id);
    if (needCheck)
        yield check_1.check({ w, c, b, a }, exports.type_id);
    if (needCheck)
        yield check_1.checkManual([
            [w, 0, 0, exports.type_id, [[w, w]]],
            [c, a, b, exports.type_id, [[a, a], [a, c]]],
            [b, 0, 0, exports.type_id, [[a, a], [a, c], [a, b]]],
            [a, 0, 0, exports.type_id, [[a, a]]],
        ], exports.type_id, GRAPH_TABLE, MP_TABLE);
});
exports.test12 = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('12');
    yield exports.clear(exports.type_id);
    const w = yield exports.insertNode(exports.type_id);
    const a = w + 2;
    const b = w + 3;
    const c = yield exports.insertLink(a, b, exports.type_id);
    yield exports.insertNode(exports.type_id);
    yield exports.insertNode(exports.type_id);
    yield exports.deleteNode(a);
    if (needCheck)
        yield check_1.check({ w, c, b, a }, exports.type_id);
    if (needCheck)
        yield check_1.checkManual([
            [w, 0, 0, exports.type_id, [[w, w]]],
            [c, a, b, exports.type_id, [[c, c]]],
            [b, 0, 0, exports.type_id, [[c, c], [c, b]]],
        ], exports.type_id, GRAPH_TABLE, MP_TABLE);
});
exports.test13 = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('13');
    yield exports.clear(exports.type_id);
    const w = yield exports.insertNode(exports.type_id);
    const a = w + 2;
    const b = w + 3;
    const c = yield exports.insertLink(a, b, exports.type_id);
    yield exports.insertNode(exports.type_id);
    yield exports.insertNode(exports.type_id);
    yield exports.deleteNode(a);
    yield exports.deleteNode(b);
    if (needCheck)
        yield check_1.check({ w, c, b, a }, exports.type_id);
    if (needCheck)
        yield check_1.checkManual([
            [w, 0, 0, exports.type_id, [[w, w]]],
            [c, a, b, exports.type_id, [[c, c]]],
        ], exports.type_id, GRAPH_TABLE, MP_TABLE);
});
exports.test14 = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('14');
    yield exports.clear(exports.type_id);
    const w = yield exports.insertNode(exports.type_id);
    const a = w + 3;
    const b = w + 2;
    const c = yield exports.insertLink(a, b, exports.type_id);
    yield exports.insertNode(exports.type_id);
    yield exports.deleteNode(c);
    if (needCheck)
        yield check_1.check({ w, c, b }, exports.type_id);
    if (needCheck)
        yield check_1.checkManual([
            [w, 0, 0, exports.type_id, [[w, w]]],
            [b, 0, 0, exports.type_id, [[b, b]]],
        ], exports.type_id, GRAPH_TABLE, MP_TABLE);
    yield exports.insertNode(exports.type_id);
});
exports.testDeeplinksDemoTree = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('deeplinks demo tree');
    yield exports.clear(exports.type_id);
    const n0 = yield exports.insertNode(exports.type_id);
    const n1 = yield exports.insertNode(exports.type_id);
    const n2 = yield exports.insertNode(exports.type_id);
    const n3 = yield exports.insertNode(exports.type_id);
    const n4 = yield exports.insertNode(exports.type_id);
    const n5 = yield exports.insertNode(exports.type_id);
    const n6 = yield exports.insertNode(exports.type_id);
    const l0 = yield exports.insertLink(n0, n1, exports.type_id);
    const l1 = yield exports.insertLink(n0, n2, exports.type_id);
    const l2 = yield exports.insertLink(n1, n3, exports.type_id);
    const l3 = yield exports.insertLink(n1, n4, exports.type_id);
    const l4 = yield exports.insertLink(n2, n5, exports.type_id);
    const l5 = yield exports.insertLink(n2, n6, exports.type_id);
    if (needCheck)
        yield check_1.check({
            n0, n1, n2, n3, n4, n5, n6, l0, l1, l2, l3, l4, l5,
        }, exports.type_id);
});
exports.testRecursive = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('recursive');
    yield exports.clear(exports.type_id);
    const a = yield exports.insertNode(exports.type_id);
    const b = yield exports.insertNode(exports.type_id);
    const c = yield exports.insertLink(b, a, exports.type_id);
    let errored = false;
    try {
        const d = yield exports.insertLink(a, b, exports.type_id);
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
    const r = yield exports.insertNode(exports.type_id);
    const a = yield exports.insertNode(exports.type_id);
    const b = yield exports.insertNode(exports.type_id);
    const x = yield exports.insertLink(r, a, exports.type_id);
    const y = yield exports.insertLink(r, b, exports.type_id);
    const c = yield exports.insertLink(b, a, exports.type_id);
    let errored = false;
    try {
        const d = yield exports.insertLink(a, b, exports.type_id);
    }
    catch (error) {
        errored = true;
    }
    if (!errored)
        throw new Error('Recursion error not exists');
});
exports.testRecursiveLong = (needCheck = true) => () => __awaiter(void 0, void 0, void 0, function* () {
    debug('recursive');
    yield exports.clear(exports.type_id);
    const a = yield exports.insertNode(exports.type_id);
    const b = yield exports.insertNode(exports.type_id);
    const c = yield exports.insertNode(exports.type_id);
    const d = yield exports.insertNode(exports.type_id);
    const x = yield exports.insertLink(a, b, exports.type_id);
    const y = yield exports.insertLink(b, c, exports.type_id);
    const z = yield exports.insertLink(c, d, exports.type_id);
    let errored = false;
    try {
        const r = yield exports.insertLink(d, a, exports.type_id);
    }
    catch (error) {
        errored = true;
    }
    if (!errored)
        throw new Error('Recursion error not exists');
});
//# sourceMappingURL=onedirectional.js.map