require('dotenv').config();

import Debug from 'debug';
import { gql } from 'apollo-boost';
import Chance from 'chance';
import { check, checkManual } from '../check.js';
import { client } from '../client.js';
import fs from 'fs';
import { beforeAllHandler, prepare, test10, test11, test12, test13, test14, test8, test9, testDeeplinksDemoTree, testMinus1, testMinus2, testMinus3, testMinus4, testMinus5, testMinus7, testMultiparentalTree, testMultipleWays, testPlus1, testPlus2, testPlus3, testPlus4, testPlus5, testPlus7, testRecursive, testRecursiveLong, testRecursiveSameRoot, testtree } from '../imports/onedirectional.js';

const DELAY = +process.env.DELAY || 0;
const delay = time => new Promise(res => setTimeout(res, time));

const itDelay = () => {
  if (DELAY) {
    (it)('delay', async () => {
      await delay(DELAY);
    });
  }
};

beforeAll(beforeAllHandler); 
(it)('prepare', prepare);

it('+1', testPlus1(true));
itDelay();
it('-1', testMinus1(true));
itDelay();
it('+2', testPlus2(true));
itDelay();
it('-2', testMinus2(true));
itDelay();
it('+3', testPlus3(true));
itDelay();
it('-3', testMinus3(true));
itDelay();
it('+4', testPlus4(true));
itDelay();
it('-4', testMinus4(true));
itDelay();
it('+5', testPlus5(true));
itDelay();
it('-5', testMinus5(true));
itDelay();
it('+7', testPlus7(true));
itDelay();
it('-7', testMinus7(true));
itDelay();
it('tree', testtree(true), 50000);
itDelay();
it('multiple ways', testMultipleWays(true));
itDelay();
it('multiparental tree', testMultiparentalTree(true));
itDelay();
it('8', test8(true));
itDelay();
it('9', test9(true));
itDelay();
it('10', test10(true));
itDelay();
it('11', test11(true));
itDelay();
it('12', test12(true));
itDelay();
it('13', test13(true));
itDelay();
it('14', test14(true));
itDelay();
it('deeplinks demo tree', testDeeplinksDemoTree(true));
itDelay();
it('recursive', testRecursive(true));
itDelay();
it('recursiveSameRoot', testRecursiveSameRoot(true));
itDelay();
it('recursiveLong', testRecursiveLong(true));