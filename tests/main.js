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
require('dotenv').config();
const debug_1 = __importDefault(require("debug"));
const apollo_boost_1 = require("apollo-boost");
const chance_1 = __importDefault(require("chance"));
const check_1 = require("../check");
const client_1 = require("../client");
const chance = new chance_1.default();
const debug = debug_1.default('deepcase:materialized-path:test');
const SCHEMA = process.env.MIGRATIONS_SCHEMA || 'public';
const MP_TABLE = process.env.MIGRATIONS_MP_TABLE || 'mp_example__links__mp';
const GRAPH_TABLE = process.env.MIGRATIONS_GRAPH_TABLE || 'mp_example__links';
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
const insertNode = (type_id, idType = ID_TYPE) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const result = yield client_1.client.mutate({ mutation: apollo_boost_1.gql `mutation InsertNode($type_id: ${idType}) {
    insert_links: insert_${GRAPH_TABLE}(objects: { type_id: $type_id }) { returning { id } }
  }`, variables: { type_id } });
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
const insertLink = (fromId, toId, type_id, idType = ID_TYPE) => __awaiter(void 0, void 0, void 0, function* () {
    var _g, _h, _j, _k;
    const result = yield client_1.client.mutate({ mutation: apollo_boost_1.gql `mutation InsertLink($fromId: ${idType}, $toId: ${idType}, $type_id: ${idType}) {
    insert_links: insert_${GRAPH_TABLE}(objects: { from_id: $fromId, to_id: $toId, type_id: $type_id }) { returning { id } }
  }`, variables: { fromId, toId, type_id } });
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
                const id = yield insertLink(sn.id, tn.id, type_id);
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
it('+1', () => __awaiter(void 0, void 0, void 0, function* () {
    debug('+1');
    yield clear(type_id);
    const a = yield insertNode(type_id);
    const b = yield insertNode(type_id);
    yield check_1.check({ a, b }, type_id);
}));
itDelay();
it('-1', () => __awaiter(void 0, void 0, void 0, function* () {
    debug('-1');
    yield clear(type_id);
    const a = yield insertNode(type_id);
    const b = yield insertNode(type_id);
    yield deleteNode(a);
    yield check_1.check({ a, b }, type_id);
}));
itDelay();
it('+2', () => __awaiter(void 0, void 0, void 0, function* () {
    debug('+2');
    yield clear(type_id);
    const a = yield insertNode(type_id);
    const b = yield insertNode(type_id);
    const c = yield insertLink(a, b, type_id);
    yield check_1.check({ a, b, c }, type_id);
}));
itDelay();
it('-2', () => __awaiter(void 0, void 0, void 0, function* () {
    debug('-2');
    yield clear(type_id);
    const a = yield insertNode(type_id);
    const b = yield insertNode(type_id);
    const c = yield insertLink(a, b, type_id);
    yield deleteNode(c);
    yield check_1.check({ a, b, c }, type_id);
}));
itDelay();
it('+3', () => __awaiter(void 0, void 0, void 0, function* () {
    debug('+3');
    yield clear(type_id);
    const a = yield insertNode(type_id);
    const b = yield insertNode(type_id);
    const c = yield insertLink(a, b, type_id);
    const d = yield insertNode(type_id);
    const e = yield insertLink(b, d, type_id);
    yield check_1.check({ a, b, c, d, e }, type_id);
    yield check_1.checkManual([
        [a, 0, 0, type_id, [[a, a]]],
        [b, 0, 0, type_id, [[a, a], [a, c], [a, b]]],
        [c, a, b, type_id, [[a, a], [a, c]]],
        [d, 0, 0, type_id, [[a, a], [a, c], [a, b], [a, e], [a, d]]],
        [e, b, d, type_id, [[a, a], [a, c], [a, b], [a, e]]],
    ], type_id, GRAPH_TABLE, MP_TABLE);
}));
itDelay();
it('-3', () => __awaiter(void 0, void 0, void 0, function* () {
    debug('-3');
    yield clear(type_id);
    const a = yield insertNode(type_id);
    const b = yield insertNode(type_id);
    const c = yield insertLink(a, b, type_id);
    const d = yield insertNode(type_id);
    const e = yield insertLink(b, d, type_id);
    yield deleteNode(e);
    yield check_1.check({ a, b, c, d, e }, type_id);
    yield check_1.checkManual([
        [a, 0, 0, type_id, [[a, a]]],
        [b, 0, 0, type_id, [[a, a], [a, c], [a, b]]],
        [c, a, b, type_id, [[a, a], [a, c]]],
        [d, 0, 0, type_id, [[d, d]]],
    ], type_id, GRAPH_TABLE, MP_TABLE);
}));
itDelay();
it('+4', () => __awaiter(void 0, void 0, void 0, function* () {
    debug('+4');
    yield clear(type_id);
    const a = yield insertNode(type_id);
    const b = yield insertNode(type_id);
    const c = yield insertLink(a, b, type_id);
    const d = yield insertNode(type_id);
    const e = yield insertLink(b, d, type_id);
    const x = yield insertNode(type_id);
    const y = yield insertLink(x, a, type_id);
    yield check_1.check({ a, b, c, d, e, x, y }, type_id);
}));
itDelay();
it('-4', () => __awaiter(void 0, void 0, void 0, function* () {
    debug('-4');
    yield clear(type_id);
    const a = yield insertNode(type_id);
    const b = yield insertNode(type_id);
    const c = yield insertLink(a, b, type_id);
    const d = yield insertNode(type_id);
    const e = yield insertLink(b, d, type_id);
    const x = yield insertNode(type_id);
    const y = yield insertLink(x, a, type_id);
    yield deleteNode(y);
    yield check_1.check({ a, b, c, d, e, x, y }, type_id);
    yield check_1.checkManual([
        [a, 0, 0, type_id, [[a, a]]],
        [b, 0, 0, type_id, [[a, a], [a, c], [a, b]]],
        [c, a, b, type_id, [[a, a], [a, c]]],
        [d, 0, 0, type_id, [[a, a], [a, c], [a, b], [a, e], [a, d]]],
        [e, b, d, type_id, [[a, a], [a, c], [a, b], [a, e]]],
        [x, 0, 0, type_id, [[x, x]]],
    ], type_id, GRAPH_TABLE, MP_TABLE);
}));
itDelay();
it('+5', () => __awaiter(void 0, void 0, void 0, function* () {
    debug('+5');
    yield clear(type_id);
    const a = yield insertNode(type_id);
    const b = yield insertNode(type_id);
    const c = yield insertLink(a, b, type_id);
    const d = yield insertNode(type_id);
    const e = yield insertLink(b, d, type_id);
    const x = yield insertNode(type_id);
    const y = yield insertLink(x, b, type_id);
    yield check_1.check({ a, b, c, d, e, x, y }, type_id);
    yield check_1.checkManual([
        [a, 0, 0, type_id, [[a, a]]],
        [b, 0, 0, type_id, [[a, a], [a, c], [a, b], [x, x], [x, y], [x, b]]],
        [c, a, b, type_id, [[a, a], [a, c]]],
        [d, 0, 0, type_id, [[a, a], [a, c], [a, b], [a, e], [a, d], [x, x], [x, y], [x, b], [x, e], [x, d]]],
        [e, b, d, type_id, [[a, a], [a, c], [a, b], [a, e], [x, x], [x, y], [x, b], [x, e]]],
        [x, 0, 0, type_id, [[x, x]]],
        [y, x, b, type_id, [[x, x], [x, y]]],
    ], type_id, GRAPH_TABLE, MP_TABLE);
}));
itDelay();
it('-5', () => __awaiter(void 0, void 0, void 0, function* () {
    debug('-5');
    yield clear(type_id);
    const a = yield insertNode(type_id);
    const b = yield insertNode(type_id);
    const c = yield insertLink(a, b, type_id);
    const d = yield insertNode(type_id);
    const e = yield insertLink(b, d, type_id);
    const x = yield insertNode(type_id);
    const y = yield insertLink(x, b, type_id);
    yield deleteNode(y);
    yield check_1.check({ a, b, c, d, e, x, y }, type_id);
    yield check_1.checkManual([
        [a, 0, 0, type_id, [[a, a]]],
        [b, 0, 0, type_id, [[a, a], [a, c], [a, b]]],
        [c, a, b, type_id, [[a, a], [a, c]]],
        [d, 0, 0, type_id, [[a, a], [a, c], [a, b], [a, e], [a, d]]],
        [e, b, d, type_id, [[a, a], [a, c], [a, b], [a, e]]],
        [x, 0, 0, type_id, [[x, x]]],
    ], type_id, GRAPH_TABLE, MP_TABLE);
}));
itDelay();
it('+7', () => __awaiter(void 0, void 0, void 0, function* () {
    debug('+7');
    yield clear(type_id);
    const a = yield insertNode(type_id);
    const b = yield insertNode(type_id);
    const c = yield insertLink(a, b, type_id);
    const d = yield insertNode(type_id);
    const e = yield insertLink(b, d, type_id);
    const y = yield insertLink(a, d, type_id);
    yield check_1.check({ a, b, c, d, e, y }, type_id);
}));
itDelay();
it('-7', () => __awaiter(void 0, void 0, void 0, function* () {
    debug('-7');
    yield clear(type_id);
    const a = yield insertNode(type_id);
    const b = yield insertNode(type_id);
    const c = yield insertLink(a, b, type_id);
    const d = yield insertNode(type_id);
    const e = yield insertLink(b, d, type_id);
    const y = yield insertLink(a, d, type_id);
    yield deleteNode(y);
    yield check_1.check({ a, b, c, d, e, y }, type_id);
}));
itDelay();
it('tree', () => __awaiter(void 0, void 0, void 0, function* () {
    debug('tree');
    yield clear(type_id);
    const a = yield insertNode(type_id);
    const { array } = generateTree(a, 1000);
    const ids = yield insertNodes(array.map((_a) => {
        var { id } = _a, a = __rest(_a, ["id"]);
        return (Object.assign(Object.assign({}, a), { type_id }));
    }));
    const ns = {};
    for (let d = 0; d < ids.length; d++)
        ns[ids[d]] = ids[d];
    yield check_1.check(Object.assign({ a }, ns), type_id);
}));
itDelay();
it('multiple ways', () => __awaiter(void 0, void 0, void 0, function* () {
    debug('multiple ways');
    yield clear(type_id);
    const a = yield insertNode(type_id);
    const b = yield insertNode(type_id);
    const c = yield insertNode(type_id);
    const d = yield insertNode(type_id);
    const x = yield insertLink(a, b, type_id);
    const y = yield insertLink(a, b, type_id);
    const r = yield insertLink(a, c, type_id);
    const m = yield insertLink(b, d, type_id);
    const n = yield insertLink(b, d, type_id);
    const f = yield insertLink(d, c, type_id);
    yield check_1.check({ a, b, c, d, x, y, r, m, n, f }, type_id);
}));
it('multiparental tree', () => __awaiter(void 0, void 0, void 0, function* () {
    debug('multiparental tree');
    yield clear(type_id);
    const a = yield insertNode(type_id);
    const { array } = generateTree(a, 100);
    const ids = yield insertNodes(array.map((_a) => {
        var { id } = _a, a = __rest(_a, ["id"]);
        return (Object.assign(Object.assign({}, a), { type_id }));
    }));
    const ns = {};
    for (let d = 0; d < ids.length; d++)
        ns[ids[d]] = ids[d];
    yield generateMultiparentalTree(array, ns, 30);
    yield check_1.check(Object.assign({ a }, ns), type_id);
}));
it('8', () => __awaiter(void 0, void 0, void 0, function* () {
    debug('8');
    yield clear(type_id);
    const w = yield insertNode(type_id);
    const a = w + 2;
    const b = w + 3;
    const c = yield insertLink(a, b, type_id);
    yield check_1.check({ w }, type_id);
    yield check_1.checkManual([
        [w, 0, 0, type_id, [[w, w]]],
        [c, a, b, type_id, [[c, c]]],
    ], type_id, GRAPH_TABLE, MP_TABLE);
    yield insertNode(type_id);
    yield insertNode(type_id);
}));
it('9', () => __awaiter(void 0, void 0, void 0, function* () {
    debug('9');
    yield clear(type_id);
    const w = yield insertNode(type_id);
    const a = w + 2;
    const b = w + 3;
    const c = yield insertLink(a, b, type_id);
    yield insertNode(type_id);
    yield check_1.check({ w, c, a }, type_id);
    yield check_1.checkManual([
        [w, 0, 0, type_id, [[w, w]]],
        [c, a, b, type_id, [[a, a], [a, c]]],
        [a, 0, 0, type_id, [[a, a]]],
    ], type_id, GRAPH_TABLE, MP_TABLE);
    yield insertNode(type_id);
}));
it('10', () => __awaiter(void 0, void 0, void 0, function* () {
    debug('10');
    yield clear(type_id);
    const w = yield insertNode(type_id);
    const a = w + 3;
    const b = w + 2;
    const c = yield insertLink(a, b, type_id);
    yield insertNode(type_id);
    yield check_1.check({ w, c, b }, type_id);
    yield check_1.checkManual([
        [w, 0, 0, type_id, [[w, w]]],
        [c, a, b, type_id, [[c, c]]],
        [b, 0, 0, type_id, [[c, c], [c, b]]],
    ], type_id, GRAPH_TABLE, MP_TABLE);
    yield insertNode(type_id);
}));
it('11', () => __awaiter(void 0, void 0, void 0, function* () {
    debug('11');
    yield clear(type_id);
    const w = yield insertNode(type_id);
    const a = w + 3;
    const b = w + 2;
    const c = yield insertLink(a, b, type_id);
    yield insertNode(type_id);
    yield insertNode(type_id);
    yield check_1.check({ w, c, b, a }, type_id);
    yield check_1.checkManual([
        [w, 0, 0, type_id, [[w, w]]],
        [c, a, b, type_id, [[a, a], [a, c]]],
        [b, 0, 0, type_id, [[a, a], [a, c], [a, b]]],
        [a, 0, 0, type_id, [[a, a]]],
    ], type_id, GRAPH_TABLE, MP_TABLE);
}));
it('12', () => __awaiter(void 0, void 0, void 0, function* () {
    debug('12');
    yield clear(type_id);
    const w = yield insertNode(type_id);
    const a = w + 2;
    const b = w + 3;
    const c = yield insertLink(a, b, type_id);
    yield insertNode(type_id);
    yield insertNode(type_id);
    yield deleteNode(a);
    yield check_1.check({ w, c, b, a }, type_id);
    yield check_1.checkManual([
        [w, 0, 0, type_id, [[w, w]]],
        [c, a, b, type_id, [[c, c]]],
        [b, 0, 0, type_id, [[c, c], [c, b]]],
    ], type_id, GRAPH_TABLE, MP_TABLE);
}));
it('13', () => __awaiter(void 0, void 0, void 0, function* () {
    debug('13');
    yield clear(type_id);
    const w = yield insertNode(type_id);
    const a = w + 2;
    const b = w + 3;
    const c = yield insertLink(a, b, type_id);
    yield insertNode(type_id);
    yield insertNode(type_id);
    yield deleteNode(a);
    yield deleteNode(b);
    yield check_1.check({ w, c, b, a }, type_id);
    yield check_1.checkManual([
        [w, 0, 0, type_id, [[w, w]]],
        [c, a, b, type_id, [[c, c]]],
    ], type_id, GRAPH_TABLE, MP_TABLE);
}));
it('14', () => __awaiter(void 0, void 0, void 0, function* () {
    debug('14');
    yield clear(type_id);
    const w = yield insertNode(type_id);
    const a = w + 3;
    const b = w + 2;
    const c = yield insertLink(a, b, type_id);
    yield insertNode(type_id);
    yield deleteNode(c);
    yield check_1.check({ w, c, b }, type_id);
    yield check_1.checkManual([
        [w, 0, 0, type_id, [[w, w]]],
        [b, 0, 0, type_id, [[b, b]]],
    ], type_id, GRAPH_TABLE, MP_TABLE);
    yield insertNode(type_id);
}));
it('deeplinks demo tree', () => __awaiter(void 0, void 0, void 0, function* () {
    debug('deeplinks demo tree');
    yield clear(type_id);
    const n0 = yield insertNode(type_id);
    const n1 = yield insertNode(type_id);
    const n2 = yield insertNode(type_id);
    const n3 = yield insertNode(type_id);
    const n4 = yield insertNode(type_id);
    const n5 = yield insertNode(type_id);
    const n6 = yield insertNode(type_id);
    const l0 = yield insertLink(n0, n1, type_id);
    const l1 = yield insertLink(n0, n2, type_id);
    const l2 = yield insertLink(n1, n3, type_id);
    const l3 = yield insertLink(n1, n4, type_id);
    const l4 = yield insertLink(n2, n5, type_id);
    const l5 = yield insertLink(n2, n6, type_id);
    yield check_1.check({
        n0, n1, n2, n3, n4, n5, n6, l0, l1, l2, l3, l4, l5,
    }, type_id);
}));
//# sourceMappingURL=main.js.map