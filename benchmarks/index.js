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
Object.defineProperty(exports, "__esModule", { value: true });
const benchmark_1 = require("benchmark");
const multidirectional_1 = require("../imports/multidirectional");
const onedirectional_1 = require("../imports/onedirectional");
const DELAY = +process.env.DELAY || 0;
const delay = time => new Promise(res => setTimeout(res, time));
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield onedirectional_1.beforeAllHandler();
    yield onedirectional_1.prepare();
    yield multidirectional_1.beforeAllHandler();
    const type_id = yield multidirectional_1.prepare();
    var suite = new benchmark_1.Suite();
    suite.add('testPlus1', { defer: true, fn: function (deferred) {
            return __awaiter(this, void 0, void 0, function* () {
                yield onedirectional_1.testPlus1(false)();
                deferred.resolve();
            });
        } });
    suite.add('testMinus1', { defer: true, fn: function (deferred) {
            return __awaiter(this, void 0, void 0, function* () {
                yield onedirectional_1.testMinus1(false)();
                deferred.resolve();
            });
        } });
    suite.add('testPlus2', { defer: true, fn: function (deferred) {
            return __awaiter(this, void 0, void 0, function* () {
                yield onedirectional_1.testPlus2(false)();
                deferred.resolve();
            });
        } });
    suite.add('testMinus2', { defer: true, fn: function (deferred) {
            return __awaiter(this, void 0, void 0, function* () {
                yield onedirectional_1.testMinus2(false)();
                deferred.resolve();
            });
        } });
    suite.add('testPlus3', { defer: true, fn: function (deferred) {
            return __awaiter(this, void 0, void 0, function* () {
                yield onedirectional_1.testPlus3(false)();
                deferred.resolve();
            });
        } });
    suite.add('testMinus3', { defer: true, fn: function (deferred) {
            return __awaiter(this, void 0, void 0, function* () {
                yield onedirectional_1.testMinus3(false)();
                deferred.resolve();
            });
        } });
    suite.add('testPlus4', { defer: true, fn: function (deferred) {
            return __awaiter(this, void 0, void 0, function* () {
                yield onedirectional_1.testPlus4(false)();
                deferred.resolve();
            });
        } });
    suite.add('testMinus4', { defer: true, fn: function (deferred) {
            return __awaiter(this, void 0, void 0, function* () {
                yield onedirectional_1.testMinus4(false)();
                deferred.resolve();
            });
        } });
    suite.add('testPlus5', { defer: true, fn: function (deferred) {
            return __awaiter(this, void 0, void 0, function* () {
                yield onedirectional_1.testPlus5(false)();
                deferred.resolve();
            });
        } });
    suite.add('testMinus5', { defer: true, fn: function (deferred) {
            return __awaiter(this, void 0, void 0, function* () {
                yield onedirectional_1.testMinus5(false)();
                deferred.resolve();
            });
        } });
    suite.add('testPlus7', { defer: true, fn: function (deferred) {
            return __awaiter(this, void 0, void 0, function* () {
                yield onedirectional_1.testPlus7(false)();
                deferred.resolve();
            });
        } });
    suite.add('testMinus7', { defer: true, fn: function (deferred) {
            return __awaiter(this, void 0, void 0, function* () {
                yield onedirectional_1.testMinus7(false)();
                deferred.resolve();
            });
        } });
    suite.add('test8', { defer: true, fn: function (deferred) {
            return __awaiter(this, void 0, void 0, function* () {
                yield onedirectional_1.test8(false)();
                deferred.resolve();
            });
        } });
    suite.add('test9', { defer: true, fn: function (deferred) {
            return __awaiter(this, void 0, void 0, function* () {
                yield onedirectional_1.test9(false)();
                deferred.resolve();
            });
        } });
    suite.add('test10', { defer: true, fn: function (deferred) {
            return __awaiter(this, void 0, void 0, function* () {
                yield onedirectional_1.test10(false)();
                deferred.resolve();
            });
        } });
    suite.add('test11', { defer: true, fn: function (deferred) {
            return __awaiter(this, void 0, void 0, function* () {
                yield onedirectional_1.test11(false)();
                deferred.resolve();
            });
        } });
    suite.add('test12', { defer: true, fn: function (deferred) {
            return __awaiter(this, void 0, void 0, function* () {
                yield onedirectional_1.test12(false)();
                deferred.resolve();
            });
        } });
    suite.add('test13', { defer: true, fn: function (deferred) {
            return __awaiter(this, void 0, void 0, function* () {
                yield onedirectional_1.test13(false)();
                deferred.resolve();
            });
        } });
    suite.add('test14', { defer: true, fn: function (deferred) {
            return __awaiter(this, void 0, void 0, function* () {
                yield onedirectional_1.test14(false)();
                deferred.resolve();
            });
        } });
    suite.add('testTree', { defer: true, fn: function (deferred) {
            return __awaiter(this, void 0, void 0, function* () {
                yield onedirectional_1.testtree(false)();
                deferred.resolve();
            });
        } });
    suite.add('testMultipleWays', { defer: true, fn: function (deferred) {
            return __awaiter(this, void 0, void 0, function* () {
                yield onedirectional_1.testMultipleWays(false)();
                deferred.resolve();
            });
        } });
    suite.add('testMultiparentalTree', { defer: true, fn: function (deferred) {
            return __awaiter(this, void 0, void 0, function* () {
                yield onedirectional_1.testMultiparentalTree(false)();
                deferred.resolve();
            });
        } });
    suite.on('cycle', function (event) {
        console.log(String(event.target));
    });
    suite.on('complete', function () {
        console.log('Fastest is ' + this.filter('fastest').map('name'));
    });
    suite.run({ 'async': false });
}))();
//# sourceMappingURL=index.js.map