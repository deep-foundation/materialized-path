import { Suite } from 'benchmark';
import { insertLink, insertNode, insertNodes, beforeAllHandler as beforeAllHandlerM, prepare as prepareM } from '../imports/multidirectional.js';
import { beforeAllHandler as beforeAllHandlerO, prepare as prepareO, test10, test11, test12, test13, test14, test8, test9, testMinus1, testMinus2, testMinus3, testMinus4, testMinus5, testMinus7, testMultiparentalTree, testMultipleWays, testPlus1, testPlus2, testPlus3, testPlus4, testPlus5, testPlus7, testtree } from '../imports/onedirectional.js';

const DELAY = +process.env.DELAY || 0;
const delay = time => new Promise(res => setTimeout(res, time));

(async () => {
  await beforeAllHandlerO();
  await prepareO();

  await beforeAllHandlerM();
  const type_id = await prepareM();

  var suite = new Suite();

  suite.add('testPlus1', { defer: true, fn: async function(deferred) {
    await testPlus1(false)();
    deferred.resolve();
  } });
  suite.add('testMinus1', { defer: true, fn: async function(deferred) {
    await testMinus1(false)();
    deferred.resolve();
  } });
  suite.add('testPlus2', { defer: true, fn: async function(deferred) {
    await testPlus2(false)();
    deferred.resolve();
  } });
  suite.add('testMinus2', { defer: true, fn: async function(deferred) {
    await testMinus2(false)();
    deferred.resolve();
  } });
  suite.add('testPlus3', { defer: true, fn: async function(deferred) {
    await testPlus3(false)();
    deferred.resolve();
  } });
  suite.add('testMinus3', { defer: true, fn: async function(deferred) {
    await testMinus3(false)();
    deferred.resolve();
  } });
  suite.add('testPlus4', { defer: true, fn: async function(deferred) {
    await testPlus4(false)();
    deferred.resolve();
  } });
  suite.add('testMinus4', { defer: true, fn: async function(deferred) {
    await testMinus4(false)();
    deferred.resolve();
  } });
  suite.add('testPlus5', { defer: true, fn: async function(deferred) {
    await testPlus5(false)();
    deferred.resolve();
  } });
  suite.add('testMinus5', { defer: true, fn: async function(deferred) {
    await testMinus5(false)();
    deferred.resolve();
  } });
  suite.add('testPlus7', { defer: true, fn: async function(deferred) {
    await testPlus7(false)();
    deferred.resolve();
  } });
  suite.add('testMinus7', { defer: true, fn: async function(deferred) {
    await testMinus7(false)();
    deferred.resolve();
  } });
  suite.add('test8', { defer: true, fn: async function(deferred) {
    await test8(false)();
    deferred.resolve();
  } });
  suite.add('test9', { defer: true, fn: async function(deferred) {
    await test9(false)();
    deferred.resolve();
  } });
  suite.add('test10', { defer: true, fn: async function(deferred) {
    await test10(false)();
    deferred.resolve();
  } });
  suite.add('test11', { defer: true, fn: async function(deferred) {
    await test11(false)();
    deferred.resolve();
  } });
  suite.add('test12', { defer: true, fn: async function(deferred) {
    await test12(false)();
    deferred.resolve();
  } });
  suite.add('test13', { defer: true, fn: async function(deferred) {
    await test13(false)();
    deferred.resolve();
  } });
  suite.add('test14', { defer: true, fn: async function(deferred) {
    await test14(false)();
    deferred.resolve();
  } });
  suite.add('testTree', { defer: true, fn: async function(deferred) {
    await testtree(false)();
    deferred.resolve();
  } });
  suite.add('testMultipleWays', { defer: true, fn: async function(deferred) {
    await testMultipleWays(false)();
    deferred.resolve();
  } });
  suite.add('testMultiparentalTree', { defer: true, fn: async function(deferred) {
    await testMultiparentalTree(false)();
    deferred.resolve();
  } });

  suite.on('cycle', function(event) {
    console.log(String(event.target));
  });
  suite.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  });
  // run async
  suite.run({ 'async': false });
})();