import { Suite } from 'benchmark';
import { beforeAllHandler, prepare, testMinus1, testMinus2, testMinus3, testMinus4, testMinus5, testMinus7, testPlus1, testPlus2, testPlus3, testPlus4, testPlus5, testPlus7 } from '../imports/onedirectional';

const DELAY = +process.env.DELAY || 0;
const delay = time => new Promise(res => setTimeout(res, time));

(async () => {
  await beforeAllHandler();
  await prepare();

  var suite = new Suite();
  
  // add tests
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
  // add listeners
  suite.on('cycle', function(event) {
    console.log(String(event.target));
  });
  suite.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  });
  // run async
  suite.run({ 'async': false });
})();